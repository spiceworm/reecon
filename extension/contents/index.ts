import type { PlasmoCSConfig } from "plasmo"

import * as contents from "~util/contents"

export const config: PlasmoCSConfig = {
    matches: ["https://www.reddit.com/", "https://www.reddit.com/r/*", "https://www.reddit.com/user/*"]
}

const rowObserver = new MutationObserver((mutationRecords) => {
    for (const mutationRecord of mutationRecords) {
        if ((mutationRecord.target as HTMLDivElement).id === "siteTable") {
            contents.execute().then()
            break
        }
    }
})

const commentObserver = new MutationObserver((mutationRecords) => {
    for (const mutationRecord of mutationRecords) {
        if ((mutationRecord.target as HTMLDivElement).id.startsWith("siteTable")) {
            contents.execute().then()
            break
        }
    }
})

if (document.readyState !== "loading") {
    // run content script the first time the page loads. Subsequent executions are handled by `MutationObserver`s
    contents.execute().then()

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
