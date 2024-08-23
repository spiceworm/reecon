browser.runtime.onInstalled.addListener(() => {
    browser.storage.sync.set({
        enableThreadProcessing: false,
        enableUserProcessing: false,
        showBadJujuThreads: true,
        minThreadSentiment: 0.0,
        minUserAge: 0,
        minUserIQ: 0
    });
});
