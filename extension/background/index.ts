import * as storage from "~util/storage"


chrome.runtime.onInstalled.addListener((reasonObj) => {
    if (reasonObj.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        storage.init().then()
    }
});
