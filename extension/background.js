browser.runtime.onInstalled.addListener(() => {
    browser.storage.sync.set({
        enableThreadProcessing: false,
        enableUserProcessing: false,
        hideBadJujuThreads: false,
        minThreadSentiment: 0.05,
        minUserAge: 0,
        minUserIQ: 0
    });
});
