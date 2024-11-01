import * as storage from "~util/storage"


chrome.runtime.onInstalled.addListener(async (installDetails) => {
    if (installDetails.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        await storage.init()
    }
})
