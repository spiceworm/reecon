import * as storage from "~util/storage"

chrome.tabs.onActivated.addListener(async (tabActiveInfo) => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    await storage.setActiveContentFilter(tabs[0].url)
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.active && changeInfo.url) {
        await storage.setActiveContentFilter(changeInfo.url)
    }
})

chrome.runtime.onInstalled.addListener(async (installDetails) => {
    if (installDetails.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        await storage.init()
    }
})
