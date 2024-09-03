browser.runtime.onInstalled.addListener(() => {
    browser.storage.local.set({
        accessToken: null,
        baseUrl: 'https://reecon.xyz',
        enableThreadProcessing: false,
        enableUserProcessing: false,
        hideBadJujuThreads: false,
        minThreadSentiment: 0.05,
        minUserAge: 0,
        minUserIQ: 0
    });
});
