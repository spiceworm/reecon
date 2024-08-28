browser.runtime.onInstalled.addListener(() => {
    browser.storage.sync.set({
        accessToken: null,
        baseUrl: 'http://127.0.0.1:8888',
        enableThreadProcessing: false,
        enableUserProcessing: false,
        hideBadJujuThreads: false,
        minThreadSentiment: 0.05,
        minUserAge: 0,
        minUserIQ: 0
    });
});
