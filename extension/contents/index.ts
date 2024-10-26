import type {PlasmoCSConfig} from "plasmo"
import * as dom from "~util/dom"
import * as backgroundMessage from "~util/messages"
import * as storage from "~util/storage"


export const config: PlasmoCSConfig = {
    matches: [
        "https://www.reddit.com/",
        "https://www.reddit.com/r/*",
        "https://www.reddit.com/user/*"
    ],
}


let lastExecution = null


// FIXME: bad flow for initial user experience
// Current flow: user install extension -> login -> nothing happens because the page loaded when they were not logged in
// Desired flow: user install extension -> login -> successful login triggers `execute`
const execute = async () => {
    const shouldExecuteContentScript = storage.getShouldExecuteContentScript()
    if (shouldExecuteContentScript) {
        const urlPaths = dom.getThreadUrlPaths()
        const threads = await backgroundMessage.processThreads(urlPaths)
        const contentFilter = await storage.getContentFilter()
        await dom.annotateThreads(threads, contentFilter)

        const usernameElementsMap = dom.getUsernameElementsMap()
        const usernames = Object.keys(usernameElementsMap)
        const ignoredRedditors = await backgroundMessage.getIgnoredRedditors()
        const ignoredUsernames = new Set(ignoredRedditors.map(obj => obj.username))
        const redditors = await backgroundMessage.processRedditors(usernames, ignoredUsernames)
        await dom.annotateUsernames(redditors, ignoredRedditors, usernameElementsMap, contentFilter)
    }
}


const run = () => {
    if (lastExecution !== null && Date.now() - lastExecution < 100) {
        return
    }

    lastExecution = Date.now()

    storage.getUserIsAuthenticated().then(userIsAuthenticated => {
        if (userIsAuthenticated) {
            execute().then()
        }
    })
}


const rowObserver = new MutationObserver(mutationRecords => {
    for (const mutationRecord of mutationRecords) {
        if ((mutationRecord.target as HTMLDivElement).id === "siteTable") {
            run()
            break
        }
    }
})


const commentObserver = new MutationObserver(mutationRecords => {
    for (const mutationRecord of mutationRecords) {
        if ((mutationRecord.target as HTMLDivElement).id.startsWith("siteTable")) {
            run()
            break
        }
    }
})


if (document.readyState !== 'loading') {
    // run content script the first time the page loads. Subsequent executions are handled by `MutationObserver`s
    run()

    const observerOptions = {
        subtree: true,
        childList: true,
    }

    const rowObserverTarget = document.getElementById('siteTable')
    if (rowObserverTarget !== null) {
        rowObserver.observe(rowObserverTarget, observerOptions)
    }

    const commentObserverTarget = document.querySelector('div[id^=siteTable_]')
    if (commentObserverTarget !== null && commentObserverTarget.classList.contains('nestedlisting')) {
        commentObserver.observe(commentObserverTarget, observerOptions)
    }
}
