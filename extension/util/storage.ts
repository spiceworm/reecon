import { Storage } from "@plasmohq/storage"

import * as api from "~util/api"
import * as constants from "~util/constants"
import * as misc from "~util/misc"
import type * as types from "~util/types"

// The only time `localStorage` should be accessed outside this file is when `useStorage` hook needs to point to it.
export const localStorage = new Storage({
    area: "local"
})

const _get = async (key: string): Promise<any> => {
    return (await localStorage.get(key)) as any
}

const _set = async (key: string, value: any): Promise<void> => {
    await localStorage.set(key, value)
}

export const init = async (): Promise<void> => {
    await localStorage.setMany({
        [constants.ACTIVE_CONTENT_FILTER]: constants.defaultContentFilter,
        [constants.API_STATUS_MESSAGES]: [],
        [constants.AUTH]: null,
        [constants.CONTENT_FILTERS]: [constants.defaultContentFilter],
        [constants.DEFAULT_FILTER]: constants.defaultContentFilter,
        [constants.DISABLE_EXTENSION]: false,
        [constants.EXTENSION_STATUS_MESSAGES]: constants.extensionStatusMessages,
        [constants.HIDE_BAD_SENTIMENT_THREADS]: false,
        [constants.OPENAI_API_KEY]: "",
        [constants.PRODUCER_SETTINGS]: constants.defaultProducerSettings,
        [constants.STATUS_MESSAGES]: []
    })
}

export const getActiveContentFilter = async (): Promise<types.ContentFilter> => {
    return (await _get(constants.ACTIVE_CONTENT_FILTER)) as Promise<types.ContentFilter>
}

const getApiStatusMessages = async (): Promise<types.StatusMessage[]> => {
    return (await _get(constants.API_STATUS_MESSAGES)) as Promise<types.StatusMessage[]>
}

export const getAuth = async (): Promise<types.Auth | null> => {
    const auth: types.Auth = await _get(constants.AUTH)

    if (!auth || !auth?.access || !auth?.refresh) {
        await setAuth(null)
        return null
    }

    if (misc.jwtIsValid(auth.access)) {
        return auth
    }

    if (misc.jwtIsValid(auth.refresh)) {
        const response: types.AuthTokenRefreshResponse = await api.post("/api/v1/auth/token/refresh/", { refresh: auth.refresh })
        const refreshedAuth: types.Auth = { access: response.access, refresh: auth.refresh }
        await setAuth(refreshedAuth)
        return refreshedAuth
    }

    await setAuth(null)
    return null
}

export const getDisableExtension = async (): Promise<boolean> => {
    return (await _get(constants.DISABLE_EXTENSION)) as boolean
}

const getExtensionStatusMessages = async (): Promise<types.StatusMessage[]> => {
    return (await _get(constants.EXTENSION_STATUS_MESSAGES)) as Promise<types.StatusMessage[]>
}

export const getHideBadSentimentThreads = async (): Promise<boolean> => {
    return (await _get(constants.HIDE_BAD_SENTIMENT_THREADS)) as boolean
}

export const getProducerSettings = async (): Promise<types.ProducerSettings> => {
    return (await _get(constants.PRODUCER_SETTINGS)) as types.ProducerSettings
}

export const setActiveContentFilter = async (url: string): Promise<void> => {
    const _url = new URL(url)

    let newContext: string = constants.defaultContentFilter.context

    if (_url.hostname.endsWith("reddit.com")) {
        // `context` will be the subreddit name if we are viewing a sub or an empty string if viewing home
        newContext = _url.pathname.split("/r/").at(-1).split("/")[0]
        newContext = newContext === "" ? constants.defaultContentFilter.context : newContext
    }

    let matchingContextFilterFound = false

    for (const contentFilter of (await _get(constants.CONTENT_FILTERS)) as types.ContentFilter[]) {
        if (contentFilter.context === newContext) {
            await _set(constants.ACTIVE_CONTENT_FILTER, contentFilter)
            matchingContextFilterFound = true
            break
        }
    }

    if (!matchingContextFilterFound) {
        await _set(constants.ACTIVE_CONTENT_FILTER, constants.defaultContentFilter)
    }
}

export const setApiStatusMessages = async (messages: types.StatusMessage[]): Promise<void> => {
    await _set(constants.API_STATUS_MESSAGES, messages)
}

export const setAuth = async (auth: types.Auth): Promise<void> => {
    await _set(constants.AUTH, auth)
}

export const setExtensionStatusMessage = async (messageName: string, active: boolean, messageText: string = ""): Promise<void> => {
    let extensionStatusMessages: types.StatusMessage[] = await _get(constants.EXTENSION_STATUS_MESSAGES)

    for (let message of extensionStatusMessages) {
        if (message.name === messageName) {
            message.active = active

            if (messageText.length > 0) {
                message.message = messageText
            }
        }
    }

    await _set(constants.EXTENSION_STATUS_MESSAGES, extensionStatusMessages)
}

const setStatusMessages = async (messages: types.StatusMessage[]): Promise<void> => {
    await _set(constants.STATUS_MESSAGES, messages)
}

export const shouldExecuteContentScript = async (): Promise<boolean> => {
    const auth = await getAuth()
    const disableExtension = await getDisableExtension()

    const producerSettings = await getProducerSettings()

    // NOTE: this is hardcoded to only care if the openai key exists for now
    const producerApiKeysExist = producerSettings.openai.api_key.length > 0

    return auth !== null && !disableExtension && producerApiKeysExist
}

localStorage.watch({
    [constants.API_STATUS_MESSAGES]: async (storageChange) => {
        const { oldValue, newValue } = storageChange

        await setStatusMessages(newValue.concat(await getExtensionStatusMessages()).filter((message: types.StatusMessage) => message.active))
    },
    [constants.AUTH]: async (storageChange) => {
        const { oldValue, newValue } = storageChange

        await setExtensionStatusMessage("missingAuth", !newValue)

        if (chrome.action !== undefined) {
            if (!newValue) {
                await chrome.action.setBadgeText({ text: "❕" })
                await chrome.action.setBadgeBackgroundColor({ color: "red" })
            } else {
                await chrome.action.setBadgeText({ text: "" })
                await chrome.action.setBadgeBackgroundColor({ color: null })
            }
        }
    },
    [constants.DISABLE_EXTENSION]: async (storageChange) => {
        const { oldValue, newValue } = storageChange

        await setExtensionStatusMessage("extensionDisabled", newValue)
    },
    [constants.EXTENSION_STATUS_MESSAGES]: async (storageChange) => {
        const { oldValue, newValue } = storageChange

        await setStatusMessages(newValue.concat(await getApiStatusMessages()).filter((message: types.StatusMessage) => message.active))
    },
    [constants.OPENAI_API_KEY]: async (storageChange) => {
        const { oldValue, newValue } = storageChange

        let producerSettings = await getProducerSettings()
        producerSettings.openai.api_key = newValue
        await _set(constants.PRODUCER_SETTINGS, producerSettings)

        await setExtensionStatusMessage("missingOpenAiApiKey", newValue.length === 0)
    }
})
