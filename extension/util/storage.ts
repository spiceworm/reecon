import {Storage} from "@plasmohq/storage"

import * as api from "~util/api"
import * as backgroundMessage from "~util/messages"
import * as misc from "~util/misc"
import type * as types from "~util/types"


const AUTH = '_auth'
export const CONTENT_FILTERS = '_contentFilters'
export const DEFAULT_FILTER = '_defaultFilter'
export const DISABLE_EXTENSION = '_disableExtension'
export const HIDE_BAD_SENTIMENT_THREADS = '_hideBadSentimentThreads'
export const HIDE_IGNORED_REDDITORS = '_hideIgnoredRedditors'
export const OPENAI_API_KEY = '_unvalidatedOpenaiApiKey'
const PRODUCER_SETTINGS = '_producerSettings'


// The only time `instance` should be accessed outside this file is when `useStorage` hook
// needs to point to it.
export const instance = new Storage({
    area: 'local',
})


const _get = async (key: string) => {
    return await instance.get(key) as any
}


const _set = async (key: string, value: any) => {
    return await instance.set(key, value)
}


export const init = async () => {
    const defaultContentFilter: types.ContentFilter = {
        age: 0,
        context: 'Default',
        iq: 0,
        sentiment: 0.05,
        filterType: 'default',
    }

    await instance.setMany({
        [AUTH]: null,
        [CONTENT_FILTERS]: [defaultContentFilter],
        [DEFAULT_FILTER]: defaultContentFilter,
        [DISABLE_EXTENSION]: false,
        [HIDE_BAD_SENTIMENT_THREADS]: false,
        [HIDE_IGNORED_REDDITORS]: false,
        [OPENAI_API_KEY]: "",
        [PRODUCER_SETTINGS]: [],
    })
}


export const getAuth = async (): Promise<types.Auth> => {
    const auth = await _get(AUTH) as types.Auth

    if (!auth || !auth?.access || !auth?.refresh) {
        return null
    }

    if (misc.jwtIsValid(auth.access)) {
        return auth
    }

    if (misc.jwtIsValid(auth.refresh)) {
        return api.refreshAccessToken(auth.refresh)
    }

    return null
}


export const setAuth = async (auth: types.Auth): Promise<null> => {
    return await _set(AUTH, auth) as null
}


export const getContentFilter = async () => {
    const context: string = await backgroundMessage.getCurrentContext()

    for (const contentFilter of await _get(CONTENT_FILTERS) as types.ContentFilter[]) {
        if (contentFilter.context === context) {
            return contentFilter
        }
    }
    return await _get(DEFAULT_FILTER) as types.ContentFilter
}


export const getDisableExtension = async (): Promise<boolean> => {
    return await _get(DISABLE_EXTENSION) as boolean
}


export const getHideBadSentimentThreads = async (): Promise<boolean> => {
    return await _get(HIDE_BAD_SENTIMENT_THREADS) as boolean
}


export const getHideIgnoredRedditors = async (): Promise<boolean> => {
    return await _get(HIDE_IGNORED_REDDITORS) as boolean
}


export const getProducerSettings = async () => {
    return {
        settings: [
            {
                name: "openai",
                api_key: await _get(OPENAI_API_KEY) as string
            }
        ] as types.ProducerSettings[]
    }
}


export const shouldExecuteContentScript = async (): Promise<boolean> => {
    const auth = await getAuth()
    const disableExtension = await getDisableExtension()

    const producerSettings = await getProducerSettings()
    const producerApiKeysExist = producerSettings.settings.every(producerSetting => producerSetting.api_key.length > 0)

    return auth !== null && !disableExtension && producerApiKeysExist
}


instance.watch({
    [AUTH]: (storageChange) => {
        const auth: types.Auth = storageChange.newValue

        // Manifest v2: Use `chrome.action` instead of `chrome.browserAction` for mv3
        if (!auth || !auth?.access || !auth?.refresh) {
            backgroundMessage.setPopupIcon("red", "❕").then()
        } else {
            backgroundMessage.setPopupIcon(null, "").then()
        }
    },
})
