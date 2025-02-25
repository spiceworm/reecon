import { Storage } from "@plasmohq/storage"

import * as api from "~util/api"
import * as backgroundMessage from "~util/backgroundMessages"
import * as constants from "~util/constants"
import * as misc from "~util/misc"
import type * as types from "~util/types"

// The only time `extLocalStorage` should be accessed outside this file is when `useStorage` hook needs to point to it.
export const extLocalStorage = new Storage({
    area: "local"
})

export const get = async <T>(key: string): Promise<T> => {
    return extLocalStorage.get<T>(key)
}

export const set = async (key: string, value: any): Promise<void> => {
    return extLocalStorage.set(key, value)
}

export const setMany = async (items: Record<string, any>): Promise<void> => {
    return extLocalStorage.setMany(items)
}

export const init = async (): Promise<void> => {
    await setMany({
        [constants.AUTH]: null,
        [constants.DISABLE_EXTENSION]: false,
        [constants.UI_THEME]: constants.DEFAULT_UI_THEME,

        [constants.ACTIVE_COMMENT_FILTER]: constants.defaultCommentFilter,
        [constants.ACTIVE_THREAD_FILTER]: constants.defaultThreadFilter,
        [constants.ALL_COMMENT_FILTERS]: {
            [constants.defaultCommentFilter.context]: constants.defaultCommentFilter
        },
        [constants.ALL_THREAD_FILTERS]: {
            [constants.defaultThreadFilter.context]: constants.defaultThreadFilter
        },
        [constants.DEFAULT_COMMENT_FILTER]: constants.defaultCommentFilter,
        [constants.DEFAULT_THREAD_FILTER]: constants.defaultThreadFilter,

        [constants.ALL_STATUS_MESSAGES]: [],
        [constants.API_STATUS_MESSAGES]: [],
        [constants.EXTENSION_STATUS_MESSAGES]: constants.extensionStatusMessages,

        [constants.COMMENT_AGE_CONTENT_FILTER_ENABLED]: false,
        [constants.COMMENT_IQ_CONTENT_FILTER_ENABLED]: false,
        [constants.COMMENT_SENTIMENT_POLARITY_CONTENT_FILTER_ENABLED]: false,
        [constants.COMMENT_SENTIMENT_SUBJECTIVITY_CONTENT_FILTER_ENABLED]: false,
        [constants.THREAD_SENTIMENT_POLARITY_CONTENT_FILTER_ENABLED]: false,
        [constants.THREAD_SENTIMENT_SUBJECTIVITY_CONTENT_FILTER_ENABLED]: false,

        [constants.HIDE_IGNORED_REDDITORS_ENABLED]: false,
        [constants.HIDE_UNPROCESSABLE_REDDITORS_ENABLED]: false,
        [constants.HIDE_UNPROCESSABLE_THREADS_ENABLED]: false,

        [constants.REDDITOR_CONTEXT_QUERY_PROCESSING_ENABLED]: false,
        [constants.REDDITOR_DATA_PROCESSING_ENABLED]: false,
        [constants.THREAD_CONTEXT_QUERY_PROCESSING_ENABLED]: false,
        [constants.THREAD_DATA_PROCESSING_ENABLED]: false,

        [constants.OPENAI_API_KEY]: "",
        [constants.PRODUCER_SETTINGS]: constants.defaultProducerSettings
    })
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
    return get<boolean>(constants.DISABLE_EXTENSION)
}

export const getProducerSettings = async (): Promise<types.ProducerSettings> => {
    return get<types.ProducerSettings>(constants.PRODUCER_SETTINGS)
}

export const getRedditorDataProcessingEnabled = async (): Promise<boolean> => {
    return get<boolean>(constants.REDDITOR_DATA_PROCESSING_ENABLED)
}

export const getThreadDataProcessingEnabled = async (): Promise<boolean> => {
    return get<boolean>(constants.THREAD_DATA_PROCESSING_ENABLED)
}

export const setActiveContentFilters = async (url: string): Promise<void> => {
    const _url = new URL(url)

    let newContext = "Default"

    // If the extension popup is opened for a non-reddit URL, do not accidentally set the current filter to a user
    // defined matching filter if the current URL has same structure as a reddit URL containing a subreddit name.
    // For example, https://test.com/r/test would cause a 'test' filter to get set if it were to exist.
    if (_url.hostname.endsWith("reddit.com")) {
        // `context` will be the subreddit name if we are viewing a sub or an empty string if viewing home
        const subReddit = _url.pathname.split("/r/").at(-1).split("/")[0]
        newContext = subReddit === "" ? newContext : subReddit
    }

    const allCommentFilters = await get<Record<string, types.CommentFilter>>(constants.ALL_COMMENT_FILTERS)
    const activeCommentFilter = allCommentFilters[newContext] ?? allCommentFilters["Default"]
    await set(constants.ACTIVE_COMMENT_FILTER, activeCommentFilter)

    const allThreadFilters = await get<Record<string, types.ThreadFilter>>(constants.ALL_THREAD_FILTERS)
    const activeThreadFilter = allThreadFilters[newContext] ?? allThreadFilters["Default"]
    await set(constants.ACTIVE_THREAD_FILTER, activeThreadFilter)
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

const setAllStatusMessages = async (messages: (types.ApiStatusMessage | types.ExtensionStatusMessage)[]): Promise<void> => {
    return set(constants.ALL_STATUS_MESSAGES, messages)
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
    [constants.ALL_COMMENT_FILTERS]: async (storageChange) => {
        const { oldValue, newValue } = storageChange

        // When changes are made to the default or active filters in the all filters object, ensure that the separately
        // stored default and active filters get updates as well. If the separately stored active filter no longer
        // exists in the all filters object, update the active filter to be the default filter.
        const defaultFilter = newValue[constants.defaultCommentFilter.context]
        await set(constants.DEFAULT_COMMENT_FILTER, defaultFilter)

        const activeFilter = await get<types.CommentFilter>(constants.ACTIVE_COMMENT_FILTER)
        if (activeFilter.context in newValue) {
            await set(constants.ACTIVE_COMMENT_FILTER, newValue[activeFilter.context])
        } else {
            await set(constants.ACTIVE_COMMENT_FILTER, defaultFilter)
        }
    },
    [constants.ALL_THREAD_FILTERS]: async (storageChange) => {
        const { oldValue, newValue } = storageChange

        // When changes are made to the default or active filters in the all filters object, ensure that the separately
        // stored default and active filters get updates as well. If the separately stored active filter no longer
        // exists in the all filters object, update the active filter to be the default filter.
        const defaultFilter = newValue[constants.defaultThreadFilter.context]
        await set(constants.DEFAULT_THREAD_FILTER, defaultFilter)

        const activeFilter = await get<types.ThreadFilter>(constants.ACTIVE_THREAD_FILTER)
        if (activeFilter.context in newValue) {
            await set(constants.ACTIVE_THREAD_FILTER, newValue[activeFilter.context])
        } else {
            await set(constants.ACTIVE_THREAD_FILTER, defaultFilter)
        }
    },
    [constants.API_STATUS_MESSAGES]: async (storageChange) => {
        const { oldValue, newValue } = storageChange

        await setAllStatusMessages(newValue.concat(await get(constants.EXTENSION_STATUS_MESSAGES)))

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

        await setAllStatusMessages(newValue.concat(await get(constants.API_STATUS_MESSAGES)))
    },
    [constants.OPENAI_API_KEY]: async (storageChange) => {
        const { oldValue, newValue } = storageChange

        let producerSettings = await getProducerSettings()
        producerSettings.openai.api_key = newValue
        await set(constants.PRODUCER_SETTINGS, producerSettings)

        await setExtensionStatusMessage("missingOpenAiApiKey", newValue.length === 0)
    }
})
