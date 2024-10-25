import * as storage from "~util/storage"


chrome.runtime.onInstalled.addListener((reasonObj) => {
    if (reasonObj.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        storage.init().then()
    }
});


// mv2
chrome.storage.onChanged.addListener(() => {
    storage.userIsAuthenticated().then(userAuthenticated => {
        storage.get('disableExtension').then(isDisabled => {
            // Use `chrome.action` instead of `chrome.browserAction` for mv3
            if (!userAuthenticated || isDisabled) {
                chrome.browserAction.setBadgeText({ text: "❕" });
                chrome.browserAction.setBadgeBackgroundColor({ color: "red" });
            } else {
                chrome.browserAction.setBadgeText({ text: "" });
                chrome.browserAction.setBadgeBackgroundColor({ color: null });
            }
        })
    })
})
