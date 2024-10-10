import * as data from "~util/storage"
import type * as types from "~util/types"


const initStorage = async () => {
    const defaultContentFilter: types.ContentFilter = {
        age: 0,
        context: 'Default',
        iq: 0,
        sentiment: 0.05,
        filterType: 'default',
    }

    await data.storage.setMany({
        'auth': null,
        'contentFilters': [defaultContentFilter],
        'defaultFilter': defaultContentFilter,
        'disableExtension': false,
        'enableRedditorProcessing': false,
        'enableThreadProcessing': false,
        'hideBadSentimentThreads': false,
        'hideIgnoredRedditors': false,
        'username': null,
    })
}


chrome.runtime.onInstalled.addListener((reasonObj) => {
    if (reasonObj.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        initStorage().then()
    }
});


// mv2
chrome.storage.onChanged.addListener(() => {
    data.storage.getMany(['auth', 'disableExtension']).then(settings => {
        // Use `chrome.action` instead of `chrome.browserAction` for mv3
        if (settings.auth === null || settings.auth.access === null || settings.disableExtension) {
            chrome.browserAction.setBadgeText({ text: "❕" });
            chrome.browserAction.setBadgeBackgroundColor({ color: "red" });
        } else {
            chrome.browserAction.setBadgeText({ text: "" });
            chrome.browserAction.setBadgeBackgroundColor({ color: null });
        }
    })
})


// async function sendExtensionMessage(trigger, value = null) {
//     chrome.tabs.query({ currentWindow: true, active: true }).then((tabInfo) => {
//         const tab = tabInfo[0]
//         if (tab.status === 'complete') {
//             chrome.tabs.sendMessage(tab.id, { trigger: trigger, value: value });
//         }
//     })
// }
//
//
// // When a request has finished being sent to one of the matching URLs, call async `executeExtension` function
// chrome.webRequest.onCompleted.addListener(
//     (details) => {
//         sendExtensionMessage('executeExtension').then()
//     },
//     {
//         urls: [
//             "https://www.reddit.com/r/*",
//             "https://www.reddit.com/by_id/*",
//             "https://www.reddit.com/user/*",
//         ],
//     },
// )
