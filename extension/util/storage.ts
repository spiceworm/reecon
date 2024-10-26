import {Storage} from "@plasmohq/storage"

import * as backgroundMessage from "~util/messages"
import * as contents from "~util/contents"
import type * as types from "~util/types"


const AUTH = '_auth'
export const CONTENT_FILTERS = '_contentFilters'
export const DEFAULT_FILTER = '_defaultFilter'
export const DISABLE_EXTENSION = '_disableExtension'
export const HIDE_BAD_SENTIMENT_THREADS = '_hideBadSentimentThreads'
export const HIDE_IGNORED_REDDITORS = '_hideIgnoredRedditors'
const SHOULD_EXECUTE_CONTENT_SCRIPTS = '_shouldExecuteContentScript'
const USER_IS_AUTHENTICATED = '_userIsAuthenticated'


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
        [SHOULD_EXECUTE_CONTENT_SCRIPTS]: false,  // read-only everywhere except in `Storage.watch` function
        [USER_IS_AUTHENTICATED]: false,  // read-only everywhere except in `Storage.watch` function
    })
}


export const getAuth = async (): Promise<types.Auth> => {
    if (await getUserIsAuthenticated()) {
        return await _get(AUTH) as types.Auth
    } else {
        return null
    }
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


export const getShouldExecuteContentScript = async (): Promise<boolean> => {
    return await _get(SHOULD_EXECUTE_CONTENT_SCRIPTS) as boolean
}


const setShouldExecuteContentScript = async (value: boolean): Promise<boolean> => {
    return await _set(SHOULD_EXECUTE_CONTENT_SCRIPTS, value) as null
}


export const getUserIsAuthenticated = async (): Promise<boolean> => {
    return await _get(USER_IS_AUTHENTICATED) as boolean
}

const setUserIsAuthenticated = async (value: boolean): Promise<boolean> => {
    return await _set(USER_IS_AUTHENTICATED, value) as null
}


instance.watch({
    [AUTH]: (storageChange) => {
        const auth: types.Auth = storageChange.newValue

        // Manifest v2: Use `chrome.action` instead of `chrome.browserAction` for mv3
        if (!auth || !auth?.access) {
            setUserIsAuthenticated(false).then()
            setShouldExecuteContentScript(false).then()
            backgroundMessage.setPopupIcon("red", "❕").then()
        } else {
            setUserIsAuthenticated(true).then()
            getDisableExtension().then(disableExtension => setShouldExecuteContentScript(!disableExtension).then())
            backgroundMessage.setPopupIcon(null, "").then()
        }
    },
    [DISABLE_EXTENSION]: (storageChange) => {
        const disableExtension = storageChange.newValue

        getAuth().then(auth => {
            setShouldExecuteContentScript(auth !== null && !disableExtension).then()
        })
    },
    [SHOULD_EXECUTE_CONTENT_SCRIPTS]: (storageChange) => {
        // Only call `execute` if _shouldExecuteContentScripts changed from false to true
        if (!storageChange.oldValue && storageChange.newValue) {
            contents.execute().then()
        }
    },
})
