import * as storage from "~util/storage"
import * as cache from "~util/storageCache"

chrome.tabs.onActivated.addListener(async (tabActiveInfo) => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    await storage.setActiveContentFilters(tabs[0].url)
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.active && changeInfo.url) {
        await storage.setActiveContentFilters(changeInfo.url)
    }
})

chrome.runtime.onInstalled.addListener(async (installDetails) => {
    if (installDetails.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        await cache.init()
        await storage.init()
    }
})
