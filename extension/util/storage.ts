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
        [constants.AUTH]: null,
        [constants.CONTENT_FILTERS]: [constants.defaultContentFilter],
        [constants.DEFAULT_FILTER]: constants.defaultContentFilter,
        [constants.DISABLE_EXTENSION]: false,
        [constants.HIDE_BAD_SENTIMENT_THREADS]: false,
        [constants.HIDE_IGNORED_REDDITORS]: false,
        [constants.LOCAL_STATUS_MESSAGES]: constants.localStatusMessages,
        [constants.OPENAI_API_KEY]: "",
    })
}

export const getAuth = async (): Promise<types.Auth | null> => {
    const auth = (await _get(constants.AUTH)) as types.Auth

    if (!auth || !auth?.access || !auth?.refresh) {
        return null
    }

    if (misc.jwtIsValid(auth.access)) {
        return auth
    }

    if (misc.jwtIsValid(auth.refresh)) {
        return await api.refreshAccessToken(auth.refresh)
    }

    return null
}

export const setAuth = async (auth: types.Auth): Promise<void> => {
    await _set(constants.AUTH, auth)
}

export const getActiveContentFilter = async (): Promise<types.ContentFilter> => {
    return await _get(constants.ACTIVE_CONTENT_FILTER)
}

export const setActiveContext = async (url: string): Promise<void> => {
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

export const getDisableExtension = async (): Promise<boolean> => {
    return (await _get(constants.DISABLE_EXTENSION)) as boolean
}

export const getHideBadSentimentThreads = async (): Promise<boolean> => {
    return (await _get(constants.HIDE_BAD_SENTIMENT_THREADS)) as boolean
}

export const getHideIgnoredRedditors = async (): Promise<boolean> => {
    return (await _get(constants.HIDE_IGNORED_REDDITORS)) as boolean
}

export const getProducerSettings = async () => {
    const openAiApiKey = (await _get(constants.OPENAI_API_KEY)) as string
    return {
        settings: [
            {
                name: "openai",
                api_key: openAiApiKey
            }
        ] as types.ProducerSettings[]
    }
}

export const setLocalStatusMessage = async (messageName: string, active: boolean, messageText: string = null): Promise<void> => {
    let messages: types.StatusMessage[] = await _get(constants.EXTENSION_STATUS_MESSAGES)

    for (let message of messages) {
        if (message.name === messageName) {
            message.active = active
        }
    }

    await _set(constants.EXTENSION_STATUS_MESSAGES, messages)
}

export const shouldExecuteContentScript = async (): Promise<boolean> => {
    const auth = await getAuth()
    const disableExtension = await getDisableExtension()

    const producerSettings = await getProducerSettings()
    const producerApiKeysExist = producerSettings.settings.every((producerSetting) => producerSetting.api_key.length > 0)

    return auth !== null && !disableExtension && producerApiKeysExist
}

localStorage.watch({
    [constants.AUTH]: async (storageChange) => {
        const { oldValue, newValue } = storageChange

        await setLocalStatusMessage("missingAuth", !newValue)

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

        await setLocalStatusMessage("extensionDisabled", newValue)
    },
    [constants.OPENAI_API_KEY]: async (storageChange) => {
        const { oldValue, newValue } = storageChange

        await setLocalStatusMessage("missingOpenAiApiKey", newValue.length === 0)
    }
})
