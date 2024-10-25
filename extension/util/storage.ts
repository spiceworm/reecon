import {Storage} from "@plasmohq/storage"

import * as backgroundMessage from "~util/messages"
import type * as types from "~util/types"


const _storage = new Storage({
    area: 'local',
})


_storage.watch({
    auth: (storageChange) => {
        const auth = storageChange.newValue

        // Manifest v2: Use `chrome.action` instead of `chrome.browserAction` for mv3
        if (!auth || !auth?.access) {
            _storage.set('userIsAuthenticated', false).then()
            chrome.browserAction.setBadgeText({text: "❕"})
            chrome.browserAction.setBadgeBackgroundColor({color: "red"})
        } else {
            _storage.set('userIsAuthenticated', true).then()
            chrome.browserAction.setBadgeText({text: ""})
            chrome.browserAction.setBadgeBackgroundColor({color: null})
        }
    },
})


export const init = async () => {
    const defaultContentFilter: types.ContentFilter = {
        age: 0,
        context: 'Default',
        iq: 0,
        sentiment: 0.05,
        filterType: 'default',
    }

    await _storage.setMany({
        'auth': null,
        'contentFilters': [defaultContentFilter],
        'defaultFilter': defaultContentFilter,
        'disableExtension': false,
        'hideBadSentimentThreads': false,
        'hideIgnoredRedditors': false,
        'userIsAuthenticated': false,
        'username': null,
    })
}


export const get = async (key: string) => {
    return await _storage.get(key) as any
}


export const set = async (key: string, value: any) => {
    return await _storage.set(key, value)
}


export const getContentFilter = async () => {
    const context: string = await backgroundMessage.getCurrentContext()

    for (const contentFilter of await _storage.get('contentFilters') as types.ContentFilter[]) {
        if (contentFilter.context === context) {
            return contentFilter
        }
    }

    return await _storage.get('defaultFilter') as types.ContentFilter
}
