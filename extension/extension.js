function loadSettings() {
    function _loadSettings(settings) {
        return settings;
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    let getSettings = browser.storage.local.get();
    return getSettings.then(_loadSettings, onError);
}


function apiRequest(url, type, accessToken, body) {
    return fetch(url, {
            method: type,
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Authorization': `Bearer ${accessToken}`,
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
            if (settings.hideBadJujuThreads) {
                threadRow.style.display = "none";
            } else {
                threadRow.style.display = "block";
                jujuSpan.innerText = " 🚨";
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
        const username = el.innerText;
        if (!(username in username_linkElements)) {
            username_linkElements[username] = [];
        }
        username_linkElements[username].push(el);
    }

    if (settings.enableThreadProcessing) {
        apiRequest(`${settings.baseUrl}/api/v1/reddit/threads`, 'POST', settings.accessToken,{'thread_urls': threadURLs})
    }

    // Send request to fetch processed threads and update the DOM with that info
    // Response contains a list of [{"<URL>": {"sentiment_polarity": "-0.01"}} ...] entries.
    apiRequest(`${settings.baseUrl}/api/v1/reddit/threads`, 'PUT', settings.accessToken, {'thread_urls': threadURLs})
        .then(res => res.json())
        .then(res => updateDOM_threads(res, settings));

    const usernames = Object.keys(username_linkElements)

    if (settings.enableUserProcessing) {
        apiRequest(`${settings.baseUrl}/api/v1/reddit/users`, 'POST', settings.accessToken, {'usernames': usernames})
    }

    // Send request to fetch processed users and update the DOM with that info
    // Response contains a list of [{"<username>": {"age": "22", "iq": "120"}} ...] entries.
    apiRequest(`${settings.baseUrl}/api/v1/reddit/users`, 'PUT', settings.accessToken, {'usernames': usernames})
        .then(res => res.json())
        .then(res => updateDOM_usernames(res, username_linkElements, settings));
}


function main() {
    // Only run on the current active tab
    if (document.visibilityState === "visible") {
        loadSettings().then(settings => {
            if (settings.accessToken !== null) {
                run(settings);
            }
        })
    }
}


// background.js will send an 'executeExtension' message which we are listening for here.
browser.runtime.onMessage.addListener(data => {
    if (data.trigger === 'executeExtension') {
        main();
    }
});


// Execute function when storage changes.
browser.storage.onChanged.addListener(() => {
    main()
})
