import * as api from "~util/api"
import * as storage from "~util/storage"
import * as cache from "~util/storageCache"

chrome.alarms.create("updateApiStatusMessages", { periodInMinutes: 5 })

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "updateApiStatusMessages") {
        const auth = await storage.getAuth()
        const disableExtension = await storage.getDisableExtension()

        if (auth !== null && !disableExtension) {
            // Retrieve status messages which will be used to set local variables.
            await api.updateApiStatusMessages()
        }
    }
})

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
