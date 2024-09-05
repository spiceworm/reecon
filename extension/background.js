browser.runtime.onInstalled.addListener((reasonObj) => {
    if (reasonObj.reason === browser.runtime.OnInstalledReason.INSTALL) {
        // Set default settings. Do not reset settings back to defaults for extension updates or browser updates.
        browser.storage.local.set({
            accessToken: null,
            baseUrl: 'https://reecon.xyz', // 'http://127.0.0.1:8888' for local server
            enableThreadProcessing: false,
            enableUserProcessing: false,
            hideBadJujuThreads: false,
            minThreadSentiment: 0.05,
            minUserAge: 0,
            minUserIQ: 0
        });
    }
});


// Send 'executeExtension' message to listener in extension.js
async function executeExtension() {
    browser.tabs.query({ currentWindow: true, active: true }).then((tabInfo) => {
        const tab = tabInfo[0]
        if (tab.status === 'complete') {
            browser.tabs.sendMessage(tab.id, { trigger: 'executeExtension' });
        }
    })
}


// When a request has finished being sent to one of the matching URLs, call async `executeExtension` function
browser.webRequest.onCompleted.addListener(
    (details) => {
        executeExtension().then()
    },
    {
        urls: [
            "https://www.reddit.com/r/*",
            "https://www.reddit.com/by_id/*",
            "https://www.reddit.com/user/*",
        ],
    },
)
