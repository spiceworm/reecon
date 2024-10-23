import * as data from "~util/storage"
import type * as types from "~util/types"


export const annotateThreads = async (threads: types.Thread[], contentFilter: types.ContentFilter) => {
    for (const thread of threads) {
        const threadRow = document.querySelector(`[data-permalink="${thread.path}"]`) as HTMLDivElement;
        const threadDataSpanID = `${process.env.PLASMO_PUBLIC_APP_NAME}-thread-${thread.path}`
        let threadDataSpan = document.getElementById(threadDataSpanID)

        if (threadDataSpan === null) {
            threadDataSpan = document.createElement('span')
            threadDataSpan.setAttribute("id", threadDataSpanID)
            let threadTitleElement = threadRow.querySelector('[data-event-action="title"]')
            threadTitleElement.insertAdjacentElement("beforeend", threadDataSpan)
        }

        const sentiment_polarity = thread.data.sentiment_polarity.value
        const summary = thread.data.summary.value

        threadDataSpan.title = `sentiment: ${sentiment_polarity}\u000dsummary: ${summary}`
        threadDataSpan.innerText = " 🔮"

        if (sentiment_polarity < contentFilter.sentiment) {
            const hideBadSentimentThreads = await data.storage.get('hideBadSentimentThreads')

            if (hideBadSentimentThreads) {
                threadRow.style.display = "none";
            } else {
                threadRow.style.display = "block";
                threadDataSpan.innerText = " 🚨";
            }
        }
    }
}


export const annotateUsernames = async (redditors: types.Redditor[], ignoredRedditors: types.IgnoredRedditor[], usernameElementsMap, contentFilter: types.ContentFilter) => {
    for (let redditor of redditors) {
        const username = redditor.username
        const redditorDataSpanName = `${process.env.PLASMO_PUBLIC_APP_NAME}-redditor-${username}`

        if (username in usernameElementsMap) {
            // Delete existing data spans so we can create new ones
            for (let existingDataSpan of document.getElementsByName(redditorDataSpanName)) {
                existingDataSpan.remove()
            }

            let redditorDataSpan = document.createElement('span')
            redditorDataSpan.setAttribute("name", redditorDataSpanName)
            redditorDataSpan.style.color = "yellow"

            const age = redditor.data.age.value;
            const iq = redditor.data.iq.value;
            const sentiment_polarity = redditor.data.sentiment_polarity.value;
            const summary = redditor.data.summary.value;
            redditorDataSpan.title = `age: ${age}\u000diq: ${iq}\u000dsentiment_polarity: ${sentiment_polarity}\u000dsummary: ${summary}`
            redditorDataSpan.innerText = ` [age=${age}, iq=${iq}]`;

            for (let linkElement of usernameElementsMap[username]) {
                linkElement.parentElement.insertAdjacentElement("beforeend", redditorDataSpan);
            }
        }
    }

    for (let ignoredRedditor of ignoredRedditors) {
        let username = ignoredRedditor.username
        const ignoredRedditorDataSpanName = `${process.env.PLASMO_PUBLIC_APP_NAME}-redditor-${username}`

        if (username in usernameElementsMap) {
            // Delete existing data spans so we can create new ones
            for (let existingDataSpan of document.getElementsByName(ignoredRedditorDataSpanName)) {
                existingDataSpan.remove()
            }

            let ignoredRedditorDataSpan = document.createElement('span')
            ignoredRedditorDataSpan.setAttribute("name", ignoredRedditorDataSpanName)
            ignoredRedditorDataSpan.style.color = "yellow"
            ignoredRedditorDataSpan.title = `reason: ${ignoredRedditor.reason}`
            ignoredRedditorDataSpan.innerText = ' [ignored]';

            for (let linkElement of usernameElementsMap[username]) {
                linkElement.parentElement.insertAdjacentElement("beforeend", ignoredRedditorDataSpan);
            }
        }
    }
}


// This should only be invoked from a background message
export const getCurrentContext = async () => {
    // FIXME: for some reason using `chrome.tabs` is undefined even though `browser.tabs` works as expected
    const tabs = await browser.tabs.query({currentWindow: true, active: true})
    const url = new URL(tabs[0].url)

    // this will be the subreddit name if we are viewing a sub or an empty string if viewing home
    const context: string = url.pathname.split('/r/').at(-1).split('/')[0]
    return context === '' ? 'default' : context
}


const getThreadElements = () => {
    return document.querySelectorAll('[data-permalink]:not(.comment, .ad-container)')
}


export const getThreadUrlPaths = () => {
    return [...getThreadElements()].map(el => el.getAttribute('data-permalink'))
}


const getUsernameElements = () => {
    return document.getElementsByClassName('author')
}


export const getUsernameElementsMap = () => {
    let usernameElements = {}
    for (const el of getUsernameElements() as HTMLCollectionOf<HTMLLinkElement>) {
        const username = el.innerText;
        username in usernameElements ? usernameElements[username].push(el) : usernameElements[username] = [el]
    }
    return usernameElements
}
