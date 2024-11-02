import * as storage from "~util/storage"


chrome.tabs.onActivated.addListener(async (tabActiveInfo) => {
    // FIXME: for some reason using `chrome.tabs` is undefined even though `browser.tabs` works as expected
    const tabs = await browser.tabs.query({active: true, currentWindow: true})
    await storage.setActiveContext(tabs[0].url)
})


chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (tab.active && changeInfo.url) {
            await storage.setActiveContext(changeInfo.url)
        }
    }
)


chrome.runtime.onInstalled.addListener(async (installDetails) => {
    if (installDetails.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        await storage.init()
    }
})
