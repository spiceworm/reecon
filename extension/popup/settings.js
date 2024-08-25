function saveSettings(e) {
    e.preventDefault();

    browser.storage.sync.set({
        enableThreadProcessing: document.getElementById("enableThreadProcessing").checked,
        enableUserProcessing: document.getElementById("enableUserProcessing").checked,
        hideBadJujuThreads: document.getElementById("hideBadJujuThreads").checked,
        minThreadSentiment: parseFloat(document.getElementById("minThreadSentiment").value),
        minUserAge: parseInt(document.getElementById("minUserAge").value),
        minUserIQ: parseInt(document.getElementById("minUserIQ").value)
    });

    // Close the settings popup window
    window.close();
}

function loadSettings() {
    function _loadSettings(settings) {
        // Popular form fields in the settings popup window to previously defined settings.
        document.getElementById("enableThreadProcessing").checked = settings.enableThreadProcessing;
        document.getElementById("enableUserProcessing").checked = settings.enableUserProcessing;
        document.getElementById("hideBadJujuThreads").checked = settings.hideBadJujuThreads;
        document.getElementById("minThreadSentiment").value = settings.minThreadSentiment;
        document.getElementById("minUserAge").value = settings.minUserAge;
        document.getElementById("minUserIQ").value = settings.minUserIQ;
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    let getting = browser.storage.sync.get();
    getting.then(_loadSettings, onError);
}

document.addEventListener("DOMContentLoaded", loadSettings);
document.querySelector("form").addEventListener("submit", saveSettings);
