import {Storage} from "@plasmohq/storage"

import * as api from "~util/api"
import * as misc from "~util/misc"
import type * as types from "~util/types"


export const ACTIVE_CONTENT_FILTER = '_activeContentFilter'
export const AUTH = '_auth'
export const CONTENT_FILTERS = '_contentFilters'
export const DEFAULT_FILTER = '_defaultFilter'
export const DISABLE_EXTENSION = '_disableExtension'
export const HIDE_BAD_SENTIMENT_THREADS = '_hideBadSentimentThreads'
export const HIDE_IGNORED_REDDITORS = '_hideIgnoredRedditors'
export const OPENAI_API_KEY = '_unvalidatedOpenaiApiKey'


// The only time `localStorage` should be accessed outside this file is when `useStorage` hook needs to point to it.
export const localStorage = new Storage({
    area: 'local',
})


const _get = async (key: string): Promise<any> => {
    return await localStorage.get(key) as any
}


const _set = async (key: string, value: any): Promise<void> => {
    await localStorage.set(key, value)
}


export const defaultContentFilter: types.ContentFilter = {
    age: 0,
    context: 'Default',
    iq: 0,
    sentiment: 0.05,
    filterType: 'default',
}


export const init = async (): Promise<void> => {
    await localStorage.setMany({
        [AUTH]: null,
        [ACTIVE_CONTENT_FILTER]: defaultContentFilter,
        [CONTENT_FILTERS]: [defaultContentFilter],
        [DEFAULT_FILTER]: defaultContentFilter,
        [DISABLE_EXTENSION]: false,
        [HIDE_BAD_SENTIMENT_THREADS]: false,
        [HIDE_IGNORED_REDDITORS]: false,
        [OPENAI_API_KEY]: "",
    })
}


export const getAuth = async (): Promise<types.Auth | null> => {
    const auth = await _get(AUTH) as types.Auth

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
    await _set(AUTH, auth)
}


export const getActiveContentFilter = async (): Promise<types.ContentFilter> => {
    return await _get(ACTIVE_CONTENT_FILTER)
}


export const setActiveContext = async (url: string): Promise<void> => {
    const _url = new URL(url)

    let newContext: string = defaultContentFilter.context

    if (_url.hostname.endsWith('reddit.com')) {
        // `context` will be the subreddit name if we are viewing a sub or an empty string if viewing home
        newContext = _url.pathname.split('/r/').at(-1).split('/')[0]
        newContext = newContext === '' ? defaultContentFilter.context : newContext
    }

    let matchingContextFilterFound = false

    for (const contentFilter of await _get(CONTENT_FILTERS) as types.ContentFilter[]) {
        if (contentFilter.context === newContext) {
            await _set(ACTIVE_CONTENT_FILTER, contentFilter)
            matchingContextFilterFound = true
            break
        }
    }

    if (!matchingContextFilterFound) {
        await _set(ACTIVE_CONTENT_FILTER, defaultContentFilter)
    }
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


localStorage.watch({
    [AUTH]: async (storageChange) => {
        const auth: types.Auth = storageChange.newValue

        // Manifest v2: Use `chrome.action` instead of `chrome.browserAction` for mv3
        if (!auth) {
            await chrome.browserAction.setBadgeText({text: "❕"})
            await chrome.browserAction.setBadgeBackgroundColor({color: "red"})
        } else {
            await chrome.browserAction.setBadgeText({text: ""})
            await chrome.browserAction.setBadgeBackgroundColor({color: null})
        }
    },
})
