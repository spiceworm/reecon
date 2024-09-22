// Send 'executeExtension' message to listener in extension.js
async function sendExtensionMessage(trigger) {
    browser.tabs.query({ currentWindow: true, active: true }).then((tabInfo) => {
        const tab = tabInfo[0]
        if (tab.status === 'complete') {
            browser.tabs.sendMessage(tab.id, { trigger: trigger });
        }
    })
}


browser.storage.onChanged.addListener(() => {
    browser.storage.local.get(['accessToken', 'disableExtension']).then(settings => {
        if (settings.accessToken === null || settings.disableExtension) {
            browser.action.setBadgeText({ text: "❕" });
            browser.action.setBadgeBackgroundColor({ color: "red" });
        } else {
            browser.action.setBadgeText({ text: "" });
            browser.action.setBadgeBackgroundColor({ color: null });
        }

        if (settings.disableExtension) {
            sendExtensionMessage('disableExtension').then();
        } else {
            sendExtensionMessage('enableExtension').then();
        }
    }).then(() => {
        sendExtensionMessage('executeExtension').then();
    });
})


// When a request has finished being sent to one of the matching URLs, call async `executeExtension` function
browser.webRequest.onCompleted.addListener(
    (details) => {
        sendExtensionMessage('executeExtension').then()
    },
    {
        urls: [
            "https://www.reddit.com/r/*",
            "https://www.reddit.com/by_id/*",
            "https://www.reddit.com/user/*",
        ],
    },
)


browser.runtime.onInstalled.addListener((reasonObj) => {
    if (reasonObj.reason === browser.runtime.OnInstalledReason.INSTALL) {
        // Set default settings. Do not reset settings back to defaults for extension updates or browser updates.
        browser.storage.local.set({
            accessToken: null,
            disableExtension: false,
            enableRedditorProcessing: false,
            enableThreadProcessing: false,
            refreshToken: null,
            hideBadJujuThreads: false,
            minThreadSentiment: 0.05,
            minUserAge: 0,
            minUserIQ: 0,
            username: null,
        });
    }
});
