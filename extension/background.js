browser.runtime.onInstalled.addListener((reasonObj) => {
    if (reasonObj.reason === browser.runtime.OnInstalledReason.INSTALL) {
        // Set default settings. Do not reset settings back to defaults for extension updates or browser updates.
        browser.storage.local.set({
            accessToken: null,
            baseUrl: 'https://reecon.xyz',
            enableThreadProcessing: false,
            enableUserProcessing: false,
            hideBadJujuThreads: false,
            minThreadSentiment: 0.05,
            minUserAge: 0,
            minUserIQ: 10
        });
    }
});
