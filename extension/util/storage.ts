import { Storage } from "@plasmohq/storage"

import * as api from "~util/api"
import * as constants from "~util/constants"
import * as backgroundMessage from "~util/backgroundMessages"
import * as misc from "~util/misc"
import type * as types from "~util/types"

// The only time `extLocalStorage` should be accessed outside this file is when `useStorage` hook needs to point to it.
export const extLocalStorage = new Storage({
    area: "local"
})

export const get = async (key: string): Promise<any> => {
    return extLocalStorage.get(key)
}

export const set = async (key: string, value: any): Promise<void> => {
    return extLocalStorage.set(key, value)
}

export const setMany = async (items: Record<string, any>): Promise<void> => {
    return extLocalStorage.setMany(items)
}

export const init = async (): Promise<void> => {
    await setMany({
        [constants.ACTIVE_CONTENT_FILTER]: constants.defaultContentFilter,
        [constants.AGE_CONTENT_FILTER_ENABLED]: false,
        [constants.API_STATUS_MESSAGES]: [],
        [constants.AUTH]: null,
        [constants.CONTENT_FILTERS]: [constants.defaultContentFilter],
        [constants.DEFAULT_FILTER]: constants.defaultContentFilter,
        [constants.DISABLE_EXTENSION]: false,
        [constants.EXTENSION_STATUS_MESSAGES]: constants.extensionStatusMessages,
        [constants.IQ_CONTENT_FILTER_ENABLED]: false,
        [constants.OPENAI_API_KEY]: "",
        [constants.PRODUCER_SETTINGS]: constants.defaultProducerSettings,
        [constants.REDDITOR_CONTEXT_QUERY_PROCESSING_ENABLED]: false,
        [constants.REDDITOR_DATA_PROCESSING_ENABLED]: false,
        [constants.SENTIMENT_POLARITY_CONTENT_FILTER_ENABLED]: false,
        [constants.SENTIMENT_SUBJECTIVITY_CONTENT_FILTER_ENABLED]: false,
        [constants.STATUS_MESSAGES]: [],
        [constants.THREAD_CONTEXT_QUERY_PROCESSING_ENABLED]: false,
        [constants.THREAD_DATA_PROCESSING_ENABLED]: false
    })
}

export const getActiveContentFilter = async (): Promise<types.ContentFilter> => {
    return get(constants.ACTIVE_CONTENT_FILTER)
}

const getApiStatusMessages = async (): Promise<types.ApiStatusMessage[]> => {
    return get(constants.API_STATUS_MESSAGES)
}

export const getAgeContentFilterEnabled = async (): Promise<boolean> => {
    return get(constants.AGE_CONTENT_FILTER_ENABLED)
}

export const getAuth = async (): Promise<types.Auth | null> => {
    const auth: types.Auth = await get(constants.AUTH)

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
    return get(constants.DISABLE_EXTENSION)
}

const getExtensionStatusMessages = async (): Promise<types.ExtensionStatusMessage[]> => {
    return get(constants.EXTENSION_STATUS_MESSAGES)
}

export const getIqContentFilterEnabled = async (): Promise<boolean> => {
    return get(constants.IQ_CONTENT_FILTER_ENABLED)
}

export const getProducerSettings = async (): Promise<types.ProducerSettings> => {
    return get(constants.PRODUCER_SETTINGS)
}

export const getRedditorDataProcessingEnabled = async (): Promise<boolean> => {
    return get(constants.REDDITOR_DATA_PROCESSING_ENABLED)
}

export const getSentimentPolarityContentFilterEnabled = async (): Promise<boolean> => {
    return get(constants.SENTIMENT_POLARITY_CONTENT_FILTER_ENABLED)
}

export const getSentimentSubjectivityContentFilterEnabled = async (): Promise<boolean> => {
    return get(constants.SENTIMENT_SUBJECTIVITY_CONTENT_FILTER_ENABLED)
}

export const getThreadDataProcessingEnabled = async (): Promise<boolean> => {
    return get(constants.THREAD_DATA_PROCESSING_ENABLED)
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

    for (const contentFilter of (await get(constants.CONTENT_FILTERS)) as types.ContentFilter[]) {
        if (contentFilter.context === newContext) {
            await set(constants.ACTIVE_CONTENT_FILTER, contentFilter)
            matchingContextFilterFound = true
            break
        }
    }

    if (!matchingContextFilterFound) {
        for (const contentFilter of (await get(constants.CONTENT_FILTERS)) as types.ContentFilter[]) {
            if (contentFilter.context === constants.defaultContentFilter.context) {
                await set(constants.ACTIVE_CONTENT_FILTER, contentFilter)
                break
            }
        }
    }
}

export const setApiStatusMessages = async (messages: types.ApiStatusMessage[]): Promise<void> => {
    return set(constants.API_STATUS_MESSAGES, messages)
}

export const setAuth = async (auth: types.Auth): Promise<void> => {
    return set(constants.AUTH, auth)
}

export const setExtensionStatusMessage = async (messageName: string, active: boolean, messageText: string = ""): Promise<void> => {
    let extensionStatusMessages: types.ExtensionStatusMessage[] = await get(constants.EXTENSION_STATUS_MESSAGES)

    for (let message of extensionStatusMessages) {
        if (message.name === messageName) {
            message.active = active

            if (messageText.length > 0) {
                message.message = messageText
            }
        }
    }

    return set(constants.EXTENSION_STATUS_MESSAGES, extensionStatusMessages)
}

const setStatusMessages = async (messages: (types.ApiStatusMessage | types.ExtensionStatusMessage)[]): Promise<void> => {
    return set(constants.STATUS_MESSAGES, messages)
}

export const shouldExecuteContentScript = async (): Promise<boolean> => {
    const auth = await getAuth()
    const disableExtension = await getDisableExtension()

    if (auth !== null && !disableExtension) {
        // Retrieve status messages which will be used to set local variables.
        await api.updateApiStatusMessages()
    }

    const producerSettings = await getProducerSettings()

    // NOTE: producer API key checks are currently hardcoded to only care about the openai key for now
    let producerApiKeyIsUsable = false

    const producerApiKeysExist = producerSettings.openai.api_key.length > 0
    if (producerApiKeysExist) {
        producerApiKeyIsUsable = await backgroundMessage.openAiApiKeyIsUsable(producerSettings.openai.api_key)
    }

    return auth !== null && !disableExtension && producerApiKeyIsUsable
}

extLocalStorage.watch({
    [constants.API_STATUS_MESSAGES]: async (storageChange) => {
        const { oldValue, newValue } = storageChange

        await setStatusMessages(newValue.concat(await getExtensionStatusMessages()))

        for (const message of newValue as (types.ApiStatusMessage | types.ExtensionStatusMessage)[]) {
            if (message.name === "redditorContextQueryProcessingDisabled") {
                await set(constants.REDDITOR_CONTEXT_QUERY_PROCESSING_ENABLED, !message.active)
            } else if (message.name === "redditorDataProcessingDisabled") {
                await set(constants.REDDITOR_DATA_PROCESSING_ENABLED, !message.active)
            } else if (message.name === "threadContextQueryProcessingDisabled") {
                await set(constants.THREAD_CONTEXT_QUERY_PROCESSING_ENABLED, !message.active)
            } else if (message.name === "threadDataProcessingDisabled") {
                await set(constants.THREAD_DATA_PROCESSING_ENABLED, !message.active)
            }
        }
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

        await setStatusMessages(newValue.concat(await getApiStatusMessages()))
    },
    [constants.OPENAI_API_KEY]: async (storageChange) => {
        const { oldValue, newValue } = storageChange

        let producerSettings = await getProducerSettings()
        producerSettings.openai.api_key = newValue
        await set(constants.PRODUCER_SETTINGS, producerSettings)

        await setExtensionStatusMessage("missingOpenAiApiKey", newValue.length === 0)
    }
})
