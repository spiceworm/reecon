function saveSettings(e) {
    e.preventDefault();
    browser.storage.sync.set({
        enableThreadProcessing: document.getElementById("enableThreadProcessing").checked,
        enableUserProcessing: document.getElementById("enableUserProcessing").checked,
        showBadJujuThreads: document.getElementById("showBadJujuThreads").checked,
        minUserAge: document.getElementById("minUserAge").value,
        minUserIQ: document.getElementById("minUserIQ").value,
        sentimentThreshold: document.getElementById("sentimentThreshold").value
    });

    // Close the settings popup window
    window.close();
}

function loadSettings() {
    function _loadSettings(settings) {
        let enableThreadProcessing = false;
        let enableUserProcessing = false;
        let showBadJujuThreads = true;
        let minUserAge = 0;
        let minUserIQ = 0;
        let sentimentThreshold = 0;

        if ('enableThreadProcessing' in settings) {
            enableThreadProcessing = settings.enableThreadProcessing;
        }
        if ('enableUserProcessing' in settings) {
            enableUserProcessing = settings.enableUserProcessing;
        }
        if ('showBadJujuThreads' in settings) {
            showBadJujuThreads = settings.showBadJujuThreads;
        }
        if ('minUserAge' in settings) {
            minUserAge = settings.minUserAge;
        }
        if ('minUserIQ' in settings) {
            minUserIQ = settings.minUserIQ;
        }
        if ('sentimentThreshold' in settings) {
            sentimentThreshold = settings.sentimentThreshold;
        }

        // Popular form fields in the settings popup window to previously defined settings.
        document.getElementById("enableThreadProcessing").checked = enableThreadProcessing;
        document.getElementById("enableUserProcessing").checked = enableUserProcessing;
        document.getElementById("showBadJujuThreads").checked = showBadJujuThreads;
        document.getElementById("minUserAge").value = minUserAge;
        document.getElementById("minUserIQ").value = minUserIQ;
        document.getElementById("sentimentThreshold").value = sentimentThreshold;
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    let getting = browser.storage.sync.get();
    getting.then(_loadSettings, onError);
}

document.addEventListener("DOMContentLoaded", loadSettings);
document.querySelector("form").addEventListener("submit", saveSettings);
