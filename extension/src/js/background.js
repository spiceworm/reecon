// Send 'executeExtension' message to listener in extension.js
async function sendExtensionMessage(trigger, value = null) {
    browser.tabs.query({ currentWindow: true, active: true }).then((tabInfo) => {
        const tab = tabInfo[0]
        if (tab.status === 'complete') {
            browser.tabs.sendMessage(tab.id, { trigger: trigger, value: value });
        }
    })
}


browser.storage.onChanged.addListener(() => {
    browser.storage.local.get().then(settings => {
        if (settings.accessToken === null || settings.disableExtension) {
            browser.action.setBadgeText({ text: "❕" });
            browser.action.setBadgeBackgroundColor({ color: "red" });
        } else {
            browser.action.setBadgeText({ text: "" });
            browser.action.setBadgeBackgroundColor({ color: null });
        }

        // Do not send messages to extension.js unless user is authenticated and can change settings in the popup.
        if (settings.accessToken !== null) {
            sendExtensionMessage('disableExtension', settings.disableExtension).then(() => {
                sendExtensionMessage('executeExtension', !settings.disableExtension).then();
            })
        }
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
            contentFilters: {
                custom: {},
                default: {
                    age: 0,
                    context: 'default',
                    iq: 0,
                    sentiment: 0.05,
                    type: 'default',
                },
                home: {
                    age: 0,
                    context: 'home',
                    iq: 0,
                    sentiment: 0.05,
                    type: 'home',
                },
            },
            disableExtension: false,
            enableRedditorProcessing: false,
            enableThreadProcessing: false,
            refreshToken: null,
            hideBadJujuThreads: false,
            hideIgnoredRedditors: false,
            username: null,
        });
    }
});
