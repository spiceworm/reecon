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


const execute = async () => {
    storage.get('disableExtension').then(isDisabled => {
        if (!isDisabled) {
            storage.getContentFilter().then(contentFilter => {
                const urlPaths = dom.getThreadUrlPaths()
                const usernameElementsMap = dom.getUsernameElementsMap()
                const usernames = Object.keys(usernameElementsMap)

                backgroundMessage.processThreads(urlPaths).then(threads => {
                    dom.annotateThreads(threads, contentFilter).then()
                })

                backgroundMessage.getIgnoredRedditors().then(ignoredRedditors => {
                    const ignoredUsernames = new Set(ignoredRedditors.map(obj => obj.username))

                    backgroundMessage.processRedditors(usernames, ignoredUsernames).then(redditors => {
                        dom.annotateUsernames(redditors, ignoredRedditors, usernameElementsMap, contentFilter).then()
                    })
                })
            })
        }
    })
}


const run = () => {
    if (lastExecution !== null && Date.now() - lastExecution < 100) {
        return
    }

    lastExecution = Date.now()

    storage.userIsAuthenticated().then(userAuthenticated => {
        if (userAuthenticated) {
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
