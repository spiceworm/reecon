import lscache from "lscache";
import { apiAuthRequest, getAccessToken, getIgnoredRedditors } from "./util";


function processThreads(settings) {
    lscache.setBucket('threads');
    lscache.flushExpired();

    let newThreadUrlPaths = [];
    let cachedThreadData = [];

    for (let el of document.querySelectorAll('[data-permalink]')) {
        // The above querySelector will also select comments if we are viewing a thread. However,
        // we only want to select thread rows. There will be multiple when viewing a subreddit, but
        // only one when viewing a thread. Also ignore ads that appear in the list of threads.
        if (!(el.classList.contains('comment')) && !(el.classList.contains('ad-container'))) {
            const urlPath = el.getAttribute('data-permalink');
            const cachedThread = lscache.get(urlPath);
            if (cachedThread !== null) {
                cachedThreadData.push(cachedThread);
            } else {
                newThreadUrlPaths.push(urlPath);
            }
        }
    }

    updateDOM_threads(cachedThreadData, settings);

    if (newThreadUrlPaths.length > 0) {
        // Send request to fetch processed threads and update the DOM with that info.
        // Response contains a list of [{"sentiment_polarity": "-0.01", "url": "https://reddit.com/r/..."} ...] entries.
        getAccessToken().then(accessToken => {
            if (accessToken !== null) {
                apiAuthRequest('/api/v1/reddit/threads/', 'POST', accessToken, {'paths': newThreadUrlPaths})
                    .then(response => response.json())
                    .then(responseJson => {
                        updateDOM_threads(responseJson, settings);

                        for (let thread of responseJson) {
                            lscache.set(thread.path, thread, process.env.CACHE_THREAD_FRESHNESS_MINUTES);
                        }
                    });
            }
        })
    }
}


function processRedditors(settings, ignoredRedditorObjects) {
    lscache.setBucket('redditors');
    lscache.flushExpired();

    // Map all usernames to an array containing link elements for that username.
    // The username link may appear multiple times on the same page.
    let username_linkElements = {};
    let cachedRedditorData = [];

    for (let el of document.getElementsByClassName('author')) {
        const username = el.innerText;
        if (!(username in username_linkElements)) {
            username_linkElements[username] = [];
        }
        username_linkElements[username].push(el);
    }

    const ignoredRedditorUsernames = new Set(ignoredRedditorObjects.map(obj => obj.username));

    // We only want to post usernames for processing if processed data for that username is not cached and
    // the username is not present in `ignoredRedditors`.
    let usernames = [];
    for (let username of Object.keys(username_linkElements)) {
        if (!ignoredRedditorUsernames.has(username)) {
            const redditorData = lscache.get(username);
            if (redditorData !== null) {
                cachedRedditorData.push(redditorData);
            } else {
                usernames.push(username);
            }
        }
    }

    updateDOM_usernames(cachedRedditorData, ignoredRedditorObjects, username_linkElements, settings);

    if (usernames.length > 0) {
        getAccessToken().then(accessToken => {
            if (accessToken !== null) {
                apiAuthRequest('/api/v1/reddit/redditors/', 'POST', accessToken, {'usernames': usernames})
                    .then(response => response.json())
                    .then(responseJson => {
                        // `responseJson` contains a list of [{"<username>": "spiceworm", "age": "99", "iq": "9000"}, ...] objects.
                        updateDOM_usernames(responseJson, ignoredRedditorObjects, username_linkElements, settings);

                        for (let redditor of responseJson) {
                            lscache.set(redditor.username, redditor, process.env.CACHE_REDDITOR_FRESHNESS_MINUTES);
                        }
                    });
            }
        })
    }
}


function updateDOM_threads(threadObjects, settings) {
    for (let thread of threadObjects) {
        const threadRow = document.querySelector(`[data-permalink="${thread.path}"]`);
        const sentimentSpanID = `${process.env.APP_NAME}-thread-${thread.path}`;
        let sentimentSpan = document.getElementById(sentimentSpanID);

        if (sentimentSpan === null) {
            sentimentSpan = document.createElement('span');
            sentimentSpan.setAttribute("id", sentimentSpanID);
            let threadTitleElement = threadRow.querySelector('[data-event-action="title"]')
            threadTitleElement.insertAdjacentElement("beforeend", sentimentSpan);
        }

        const sentiment_polarity = thread.data.sentiment_polarity.value;
        const summary = thread.data.summary.value;

        sentimentSpan.title = `sentiment_polarity: ${sentiment_polarity}\u000dsummary: ${summary}`;
        sentimentSpan.innerText = " 🔮";

        if (sentiment_polarity < settings.minThreadSentiment) {
            if (settings.hideBadJujuThreads) {
                threadRow.style.display = "none";
            } else {
                threadRow.style.display = "block";
                sentimentSpan.innerText = " 🚨";
            }
        }
    }
}


// Take the `userObjects` param containing a list of [{"<username>": "spiceworm, "age": 99, "iq": 9000}, ...]
// objects and create a new <span> element to insert after each username link that appears in
// the DOM.
function updateDOM_usernames(redditorObjects, ignoredRedditorObjects, username_linkElements, settings) {
    for (let redditor of redditorObjects) {
        let username = redditor.username;
        const redditorDataSpanID = `${process.env.APP_NAME}-redditor-${username}`;

        if (username in username_linkElements) {
            for (let linkElement of username_linkElements[username]) {
                let redditorDataSpan;

                if (linkElement.parentElement.lastElementChild.id === redditorDataSpanID) {
                    // Use existing statsSpan if one exists for the current linkElement
                    redditorDataSpan = linkElement.parentElement.lastElementChild;
                } else {
                    // There is no redditorStatsSpan yet. Create one and insert it after the current linkElement
                    redditorDataSpan = document.createElement('span');
                    redditorDataSpan.setAttribute("id", redditorDataSpanID);
                    redditorDataSpan.style.color = "yellow";
                    linkElement.parentElement.insertAdjacentElement("beforeend", redditorDataSpan);
                }

                const age = redditor.data.age.value;
                const iq = redditor.data.iq.value;
                const sentiment_polarity = redditor.data.sentiment_polarity.value;
                const summary = redditor.data.summary.value;

                redditorDataSpan.title = `age: ${age}\u000diq: ${iq}\u000dsentiment_polarity: ${sentiment_polarity}\u000dsummary: ${summary}`
                redditorDataSpan.innerText = ` [age=${age}, iq=${iq}]`;

                let commentDiv = linkElement.closest("div").parentElement;

                // Make sure `commentDiv` is actually a comment as it will be a `threadRow` element if the user is
                // browsing a thread list in a subreddit.
                if (commentDiv.classList.contains("comment")) {
                    // Collapse all comments that are posted by users with an age or IQ less than the specified
                    // minimum age or IQ in the settings. Otherwise, make sure they are expanded.
                    if (parseInt(age) < settings.minUserAge || parseInt(iq) < settings.minUserIQ) {
                        commentDiv.classList.remove("noncollapsed");
                        commentDiv.classList.add("collapsed");
                    }
                }
            }
        }
    }

    for (let ignoredRedditor of ignoredRedditorObjects) {
        let username = ignoredRedditor.username;
        const ignoredRedditorDataSpanID = `${process.env.APP_NAME}-redditor-${username}`;

        if (username in username_linkElements) {
            for (let linkElement of username_linkElements[username]) {
                let ignoredRedditorDataSpan;

                if (linkElement.parentElement.lastElementChild.id === ignoredRedditorDataSpanID) {
                    // Use existing statsSpan if one exists for the current linkElement
                    ignoredRedditorDataSpan = linkElement.parentElement.lastElementChild;
                } else {
                    // There is no statsSpan yet. Create one and insert it after the current linkElement
                    ignoredRedditorDataSpan = document.createElement('span');
                    ignoredRedditorDataSpan.setAttribute("id", ignoredRedditorDataSpanID);
                    ignoredRedditorDataSpan.style.color = "yellow";
                    linkElement.parentElement.insertAdjacentElement("beforeend", ignoredRedditorDataSpan);
                }

                ignoredRedditorDataSpan.title = `reason: ${ignoredRedditor.reason}`
                ignoredRedditorDataSpan.innerText = ' [ignored]';

                let commentDiv = linkElement.closest("div").parentElement;

                // Make sure `commentDiv` is actually a comment as it will be a `threadRow` element if the user is
                // browsing a thread list in a subreddit.
                if (commentDiv.classList.contains("comment")) {
                    if (settings.hideIgnoredRedditors) {
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
    getIgnoredRedditors(settings.accessToken).then(ignoredRedditorObjects => {
        if (settings.enableRedditorProcessing) {
            processRedditors(settings, ignoredRedditorObjects);
        }

        if (settings.enableThreadProcessing) {
            processThreads(settings);
        }
    })
}


function main() {
    const url = new URL(window.location.href);

    // Only run on the current active reddit tab
    if (url.host.endsWith('reddit.com') && document.visibilityState === "visible") {
        browser.storage.local.get().then(settings => {
            // TODO: can maybe remove the below condition because background.js already checks the same
            //  conditions when sending executeExtension trigger message.
            if (settings.accessToken !== null && !settings.disableExtension) {
                run(settings);
            }
        })
    }
}


browser.runtime.onMessage.addListener(data => {
    if (data.trigger === 'disableExtension') {
        let userStatSpans = document.querySelectorAll(`[id^='${process.env.APP_NAME}-user']`);
        let threadSentimentSpans = document.querySelectorAll(`[id^='${process.env.APP_NAME}-thread']`);

        if (data.value) {
            userStatSpans.forEach(el => el.style.display = 'none');
            threadSentimentSpans.forEach(el => el.style.display = 'none');
        } else {
            userStatSpans.forEach(el => el.style.display = '');
            threadSentimentSpans.forEach(el => el.style.display = '');
        }
    } else if (data.trigger === 'executeExtension') {
        if (data.value) {
            main();
            // Execute run again 5 seconds later to fetch processed results and update the DOM with those results.
            setTimeout(main, 5000);
        }
    }
});
