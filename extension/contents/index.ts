import type { PlasmoCSConfig } from "plasmo"

import * as backgroundMessage from "~util/backgroundMessages"
import * as dom from "~util/dom"
import * as storage from "~util/storage"

let lastExecution = null

export const config: PlasmoCSConfig = {
    matches: ["https://*.reddit.com/", "https://*.reddit.com/r/*", "https://*.reddit.com/user/*"]
}

const execute = async () => {
    if (lastExecution !== null && Date.now() - lastExecution < 1000) {
        return
    }

    if (await storage.shouldExecuteContentScript()) {
        lastExecution = Date.now()

        const producerSettings = await storage.getProducerSettings()

        if (await storage.getThreadDataProcessingEnabled()) {
            const urlPaths = dom.getThreadUrlPaths()
            const processThreadDataResponse = await backgroundMessage.processThreadData(producerSettings, urlPaths)

            await Promise.all([
                dom.annotatePendingThreads(processThreadDataResponse.pending),
                dom.annotateProcessedThreads(processThreadDataResponse.processed),
                dom.annotateUnprocessableThreads(processThreadDataResponse.unprocessable)
            ])
        }

        if (await storage.getRedditorDataProcessingEnabled()) {
            const usernameElementsMap = dom.getUsernameElementsMap()
            const usernames = Object.keys(usernameElementsMap)
            const processRedditorDataResponse = await backgroundMessage.processRedditorData(producerSettings, usernames)

            await Promise.all([
                dom.annotateIgnoredRedditors(processRedditorDataResponse.ignored, usernameElementsMap),
                dom.annotatePendingRedditors(processRedditorDataResponse.pending, usernameElementsMap),
                dom.annotateProcessedRedditors(processRedditorDataResponse.processed, usernameElementsMap),
                dom.annotateUnprocessableRedditors(processRedditorDataResponse.unprocessable, usernameElementsMap)
            ])
        }
    }
}

const rowObserver = new MutationObserver(async (mutationRecords) => {
    for (const mutationRecord of mutationRecords) {
        if ((mutationRecord.target as HTMLDivElement).id === "siteTable") {
            await execute()
            break
        }
    }
})

const commentObserver = new MutationObserver(async (mutationRecords) => {
    for (const mutationRecord of mutationRecords) {
        if ((mutationRecord.target as HTMLDivElement).id.startsWith("siteTable")) {
            await execute()
            break
        }
    }
})

if (document.readyState !== "loading") {
    // run content script the first time the page loads. Subsequent executions are handled by `MutationObserver`s
    execute().then()

    // run content script every 30 seconds to update the DOM with newly processed results
    setInterval(execute, 30_000)

    const observerOptions = {
        subtree: true,
        childList: true
    }

    const rowObserverTarget = document.getElementById("siteTable")
    if (rowObserverTarget !== null) {
        rowObserver.observe(rowObserverTarget, observerOptions)
    }

    const commentObserverTarget = document.querySelector("div[id^=siteTable_]")
    if (commentObserverTarget !== null && commentObserverTarget.classList.contains("nestedlisting")) {
        commentObserver.observe(commentObserverTarget, observerOptions)
    }
}
