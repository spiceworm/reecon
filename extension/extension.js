function loadSettings() {
    function _loadSettings(settings) {
        return settings;
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    let getSettings = browser.storage.sync.get();
    return getSettings.then(_loadSettings, onError);
}


function apiRequest(endpoint, type, body) {
    return fetch(
        `http://127.0.0.1:8888${endpoint}`, {
            method: type,
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        }
    )
}


function updateDOM_threads(response, settings) {
    for (let [url, sentimentPolarity] of Object.entries(response)) {
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

        if (sentimentPolarity < settings.minThreadSentiment) {
            if (settings.showBadJujuThreads) {
                threadRow.style.display = "block";
                jujuSpan.innerText = " 🚨";
            } else {
                threadRow.style.display = "none";
            }
        }
    }
}


// Take the response containing a list of [{"<username>": {"age": 1, "intelligence": "99%"}} ...]
// entries and create a new <span> element to insert after each username link that appears in
// the DOM.
function updateDOM_usernames(response, username_linkElements, settings) {
    for (let [username, linkElements] of Object.entries(username_linkElements)) {
        if (username in response) {
            const stats = response[username];
            const statsSpanID = `user-stats-${username}`;
            for (let linkElement of linkElements) {
                let statsSpan;

                if (linkElement.parentElement.lastElementChild.id === statsSpanID) {
                    // Use existing statsSpan if one exists for the current linkElement
                    statsSpan = linkElement.parentElement.lastElementChild;
                } else {
                    // There is no statsSpan yet. Create one and insert it after the current linkElement
                    statsSpan = document.createElement('span');
                    statsSpan.setAttribute("id", statsSpanID);
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

                // Make sure `commentDiv` is actually a comment as it will be a `threadRow` element if the user is
                // browsing a thread list in a subreddit.
                if (commentDiv.classList.contains("comment")) {
                    // Collapse all comments that are posted by users with an age or IQ less than the specified
                    // minimum age or IQ in the settings. Otherwise, make sure they are expanded.
                    if (parseInt(stats["age"]) < settings.minUserAge || parseInt(stats["iq"]) < settings.minUserIQ) {
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
}


function run(settings) {
    // Create an array of thread URLs. Make sure that they are for old.reddit.com.
    let threadURLs = [];
    for (let el of document.querySelectorAll('[data-permalink]')) {
        // The above querySelector will also select comments if we are viewing a thread. However,
        // we only want to select thread rows. There will be multiple when viewing a subreddit, but
        // only one when viewing a thread.
        if (!(el.classList.contains('comment'))) {
            const urlPath = el.getAttribute('data-permalink');
            let url = new URL(urlPath, 'https://old.reddit.com')
            threadURLs.push(
                url.href.replace('www.reddit.com', 'old.reddit.com')
            );
        }
    }

    // Map all usernames to an array containing link elements for that username.
    // The username link may appear multiple times on the same page.
    let username_linkElements = {};
    for (let el of document.getElementsByClassName('author')) {
        if (!(el.innerText in username_linkElements)) {
            username_linkElements[el.innerText] = [];
        }
        username_linkElements[el.innerText].push(el);
    }

    // Send request to fetch processed threads and update the DOM with that info
    // Response contains a list of [{"<URL>": {"sentiment_polarity": "-0.01"}} ...] entries.
    apiRequest('/api/v1/threads', 'PUT', threadURLs)
        .then(res => res.json())
        .then(res => updateDOM_threads(res, settings));

    if (settings.enableThreadProcessing) {
        // Submit thread URLs for processing
        apiRequest('/api/v1/threads', 'POST', threadURLs)
    }

    const usernames = Object.keys(username_linkElements)

    // Send request to fetch processed users and update the DOM with that info
    // Response contains a list of [{"<username>": {"age": "22", "iq": "120"}} ...] entries.
    apiRequest('/api/v1/users', 'PUT', {usernames: usernames})
        .then(res => res.json())
        .then(res => updateDOM_usernames(res, username_linkElements, settings));

    if (settings.enableUserProcessing) {
        // POST all usernames detected on the current page for processing.
        apiRequest('/api/v1/users', 'POST', {usernames: usernames})
    }
}

// Execute `run` every time thread rows are loaded on the page.
// Thread rows are identified by 'span.rank' selector.
let visibleThreads = 0;
const resizeObserver = new ResizeObserver(entries => {
    const detectedThreads = document.querySelectorAll('span.rank').length;
    if (detectedThreads > visibleThreads) {
        visibleThreads = detectedThreads;
        loadSettings().then(settings => {run(settings)})
    }
})
resizeObserver.observe(document.querySelector('div.content'))
