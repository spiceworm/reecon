import lscache from "lscache";
import { apiAuthRequest, getAccessToken } from "./util";


function processThreads(settings) {
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
                            lscache.set(thread.path, thread, process.env.CACHE_EXP_MINUTES);
                        }
                    });
            }
        })
    }
}


function processUsernames(settings) {
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

    // We only want to post usernames for processing if processed data for that username is not cached.
    let usernames = [];
    for (let username of Object.keys(username_linkElements)) {
        const redditorData = lscache.get(username);
        if (redditorData !== null) {
            cachedRedditorData.push(redditorData);
        } else {
            usernames.push(username);
        }
    }

    updateDOM_usernames(cachedRedditorData, username_linkElements, settings);

    if (usernames.length > 0) {
        getAccessToken().then(accessToken => {
            if (accessToken !== null) {
                apiAuthRequest('/api/v1/reddit/redditors/', 'POST', accessToken, {'usernames': usernames})
                    .then(response => response.json())
                    .then(responseJson => {
                        // `responseJson` contains a list of [{"<username>": "spiceworm", "age": "99", "iq": "9000"}, ...] objects.
                        updateDOM_usernames(responseJson, username_linkElements, settings);

                        for (let redditor of responseJson) {
                            lscache.set([redditor.username], redditor, process.env.CACHE_EXP_MINUTES);
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

        sentimentSpan.title = thread.sentiment_polarity;
        sentimentSpan.innerText = " 🔮";

        if (thread.sentiment_polarity < settings.minThreadSentiment) {
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
function updateDOM_usernames(userObjects, username_linkElements, settings) {
    for (let user of userObjects) {
        let username = user.username;
        const statsSpanID = `${process.env.APP_NAME}-user-${username}`;

        if (username in username_linkElements) {
            for (let linkElement of username_linkElements[username]) {
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

                statsSpan.innerText = ` [age=${user.age}, iq=${user.iq}]`;
                // if ("error" in stats) {
                //     statsSpan.innerText = ` [error=${stats['error']}]`;
                //     statsSpan.style.color = "red";
                // } else {
                //     statsSpan.innerText = ` [age=${stats['age']}, iq=${stats['iq']}]`;
                // }

                let commentDiv = linkElement.closest("div").parentElement;

                // Make sure `commentDiv` is actually a comment as it will be a `threadRow` element if the user is
                // browsing a thread list in a subreddit.
                if (commentDiv.classList.contains("comment")) {
                    // Collapse all comments that are posted by users with an age or IQ less than the specified
                    // minimum age or IQ in the settings. Otherwise, make sure they are expanded.
                    if (parseInt(user.age) < settings.minUserAge || parseInt(user.iq) < settings.minUserIQ) {
                        commentDiv.classList.remove("noncollapsed");
                        commentDiv.classList.add("collapsed");
                    }
                }
            }
        }
    }
}


function run(settings) {
    if (settings.enableThreadProcessing) {
        lscache.setBucket('threads');
        lscache.flushExpired();
        processThreads(settings);
    }

    if (settings.enableUserProcessing) {
        lscache.setBucket('usernames');
        lscache.flushExpired();
        processUsernames(settings);
    }
}


function main() {
    const url = new URL(window.location.href);

    // Only run on the current active reddit tab
    if (url.host.endsWith('reddit.com') && document.visibilityState === "visible") {
        browser.storage.local.get().then(settings => {
            if (settings.accessToken !== null && !settings.disableExtension) {
                run(settings);
            }
        })
    }
}


browser.runtime.onMessage.addListener(data => {
    if (data.trigger === 'disableExtension') {
        let userStatSpans = document.querySelectorAll(`[id^='${process.env.APP_NAME}-user']`);
        userStatSpans.forEach(el => el.style.display = 'none');

        let threadSentimentSpans = document.querySelectorAll(`[id^='${process.env.APP_NAME}-thread']`);
        threadSentimentSpans.forEach(el => el.style.display = 'none');
    }
});


browser.runtime.onMessage.addListener(data => {
    if (data.trigger === 'enableExtension') {
        let userStatSpans = document.querySelectorAll(`[id^='${process.env.APP_NAME}-user']`);
        userStatSpans.forEach(el => el.style.display = '');

        let threadSentimentSpans = document.querySelectorAll(`[id^='${process.env.APP_NAME}-thread']`);
        threadSentimentSpans.forEach(el => el.style.display = '');
    }
});


// background.js will send an 'executeExtension' message which we are listening for here.
browser.runtime.onMessage.addListener(data => {
    if (data.trigger === 'executeExtension') {
        main();
        // Execute run again 5 seconds later to fetch processed results and update the DOM with those results.
        setTimeout(main, 5000);
    }
});
