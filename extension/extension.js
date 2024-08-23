const defaultSettings = {
    enableThreadProcessing: false,
    enableUserProcessing: false,
    showBadJujuThreads: true,
    minUserAge: 0,
    minUserIQ: 0,
    sentimentThreshold: 0
};

let enableThreadProcessing = defaultSettings.enableThreadProcessing;
let enableUserProcessing = defaultSettings.enableUserProcessing;
let showBadJujuThreads = defaultSettings.showBadJujuThreads;
let minUserAge = defaultSettings.minUserAge;
let minUserIQ = defaultSettings.minUserIQ;
let sentimentThreshold = defaultSettings.sentimentThreshold;

function loadSettings() {
    function getCurrentSettings(settings) {
        enableThreadProcessing = settings.enableThreadProcessing;
        enableUserProcessing = settings.enableUserProcessing;
        showBadJujuThreads = settings.showBadJujuThreads;
        minUserAge = parseInt(settings.minUserAge);
        minUserIQ = parseInt(settings.minUserIQ);
        sentimentThreshold = parseFloat(settings.sentimentThreshold);
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    let getSettings = browser.storage.sync.get(defaultSettings);
    getSettings.then(getCurrentSettings, onError);
}


function run() {
    let threadCommentsLinkElements = document.getElementsByClassName('comments');
    let userLinkElements = document.getElementsByClassName('author');

    let threadURLs = [];
    let userName_linkElement_map = {};

    // Create an array of thread URLs. Make sure that they are for old.reddit.com.
    for (let el of threadCommentsLinkElements) {
        const url = el.href.replace("www.reddit.com", "old.reddit.com");
        threadURLs.push(url);
    }

    // Map each userName to an empty array
    for (let el of userLinkElements) {userName_linkElement_map[el.innerText] = [];}

    // Append all the linkElements for each user's comments to that array.
    // The user may have commented posted multiple times in the same thread.
    for (let el of userLinkElements) {userName_linkElement_map[el.innerText].push(el);}

    function updateDOM_threads(response) {
        for (let url of threadURLs) {
            if (url in response) {
                const sentimentPolarity = response[url];

                const threadUrl = new URL(url);
                const threadRow = document.querySelector(`[data-permalink="${threadUrl.pathname}"]`);

                const jujuSpanID = `thread-juju-${url}`;
                let jujuSpan = document.getElementById(jujuSpanID);

                if (jujuSpan === null) {
                    jujuSpan = document.createElement('span');
                    jujuSpan.setAttribute("id", jujuSpanID);
                    let threadTitleElement = threadRow.querySelector('[data-event-action="title"]')
                    threadTitleElement.insertAdjacentElement("beforeend", jujuSpan);
                }

                jujuSpan.title = sentimentPolarity;
                jujuSpan.innerText = " 🔮";

                if (sentimentPolarity < sentimentThreshold) {
                    if (showBadJujuThreads) {
                        threadRow.style.display = "block";
                        jujuSpan.innerText = " 🚨";
                    } else {
                        threadRow.style.display = "none";
                    }
                }
            }
        }
    }

    // Take the response containing a list of [{"<username>": {"age": 1, "intelligence": "99%"}} ...]
    // entries and create a new <span> element to insert after each username link that appears in
    // the DOM.
    function updateDOM_userNames(response) {
        for (let [userName, linkElements] of Object.entries(userName_linkElement_map)) {
            if (userName in response) {
                const stats = response[userName];
                const userStatsSpanID = `user-stats-${userName}`;
                for (let linkElement of linkElements) {

                    let statsSpan;
                    if (linkElement.parentElement.lastElementChild.id === userStatsSpanID) {
                        // There is an existing statsSpan that we just need to update the innerText
                        statsSpan = linkElement.parentElement.lastElementChild;
                    } else {
                        // There is no statsSpan yet. Create one and insert it into the DOM.
                        statsSpan = document.createElement('span');
                        statsSpan.setAttribute("id", userStatsSpanID);
                        statsSpan.style.color = "yellow";
                        linkElement.parentElement.insertAdjacentElement("beforeend", statsSpan);
                    }

                    if ("error" in stats) {
                        statsSpan.innerText = ` [error=${stats['error']}]`;
                        statsSpan.style.color = "red";
                    } else {
                        statsSpan.innerText = ` [age=${stats['age']}, iq=${stats['iq']}]`;
                    }

                    let commentDiv = linkElement.closest("div").parentElement;

                    // Collapse all comments that are posted by users with an age or IQ less than the
                    // minimum age or IQ. Otherwise, make sure they are expanded.
                    if (parseInt(stats["age"]) < minUserAge || parseInt(stats["iq"]) < minUserIQ) {
                        commentDiv.classList.remove("noncollapsed");
                        commentDiv.classList.add("collapsed");
                    } else {
                        commentDiv.classList.remove("collapsed");
                        commentDiv.classList.add("noncollapsed");
                    }
                }
            }
        }
    }

    const headers = {'Accept': 'application/json, text/plain, */*', 'Content-Type': 'application/json'}

    // Send request to fetch processed threads and update the DOM with that info
    // Response contains a list of [{"<URL>": {"sentiment_polarity": "-0.01"}} ...] entries.
    fetch(
        'http://127.0.0.1:8888/api/v1/threads', {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(threadURLs),
        }
    )
            .then(res => res.json())
            .then(res => updateDOM_threads(res));

    // Send request to fetch processed users and update the DOM with that info
    // Response contains a list of [{"<username>": {"age": "22", "iq": "120"}} ...] entries.
    fetch(
        'http://127.0.0.1:8888/api/v1/users', {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({
                usernames: Object.keys(userName_linkElement_map)
            }),
        }
    )
            .then(res => res.json())
            .then(res => updateDOM_userNames(res));

    if (enableThreadProcessing) {
        // Submit thread URLs for processing
        fetch(
            'http://127.0.0.1:8888/api/v1/threads', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(threadURLs),
            }
        )
    }

    if (enableUserProcessing) {
        // POST all usernames detected on the current page for processing.
        fetch(
            'http://127.0.0.1:8888/api/v1/users', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    usernames: Object.keys(userName_linkElement_map)
                }),
            }
        )
    }
}

// Executes every 10 second
window.setInterval(function () {
    loadSettings();
    run();
}, 10_000)
