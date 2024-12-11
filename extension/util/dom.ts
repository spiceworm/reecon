import * as storage from "~util/storage"
import type * as types from "~util/types"

export const annotatePendingThreads = async (pendingThreads: types.PendingThread[], contentFilter: types.ContentFilter) => {
    for (const thread of pendingThreads) {
        const dataSpanPrefix = `${process.env.PLASMO_PUBLIC_APP_NAME}-${thread.path}`
        const dataSpanName = `${dataSpanPrefix}-pendingThread`

        // Delete all existing data spans for the thread so we can create new ones. This will also delete out
        // of date information for the thread. For example, if it was pending and then was successfully
        // processed, this will delete the pending annotation so that both are not present in the DOM.
        ;[...document.querySelectorAll(`span[name^=${CSS.escape(dataSpanPrefix)}]`)].map((span) => span.remove())

        let dataSpan = document.createElement("span")
        dataSpan.setAttribute("name", dataSpanName)
        dataSpan.title = "Submitted for processing"
        dataSpan.innerText = " 🕒"

        getThreadTitleElement(thread.path).insertAdjacentElement("beforeend", dataSpan)
    }
}

export const annotateProcessedThreads = async (processedThreads: types.Thread[], contentFilter: types.ContentFilter) => {
    for (const thread of processedThreads) {
        const threadRow = getThreadRowElement(thread.path)
        const dataSpanPrefix = `${process.env.PLASMO_PUBLIC_APP_NAME}-${thread.path}`
        const dataSpanName = `${dataSpanPrefix}-processedThread`

        // Delete all existing data spans for the thread so we can create new ones. This will also delete out
        // of date information for the thread. For example, if it was pending and then was successfully
        // processed, this will delete the pending annotation so that both are not present in the DOM.
        ;[...document.querySelectorAll(`span[name^=${CSS.escape(dataSpanPrefix)}]`)].map((span) => span.remove())

        let dataSpan = document.createElement("span")
        dataSpan.setAttribute("name", dataSpanName)

        const sentiment_polarity = thread.data.sentiment_polarity.value

        dataSpan.title = [
            `processed: ${thread.data.created}`,
            `keywords: ${thread.data.keywords.value}`,
            `sentiment_polarity: ${sentiment_polarity}`,
            `sentiment_subjectivity: ${thread.data.sentiment_subjectivity.value}`,
            `total_inputs: ${thread.data.total_inputs}`,
            `summary: ${thread.data.summary.value}`
        ].join("\u000d")

        dataSpan.innerText = " 🔮"

        getThreadTitleElement(thread.path).insertAdjacentElement("beforeend", dataSpan)

        if (sentiment_polarity < contentFilter.sentimentPolarity) {
            if (await storage.getHideBadSentimentThreads()) {
                threadRow.style.display = "none"
            } else {
                threadRow.style.display = "block"
                dataSpan.innerText = " 🚨"
            }
        }
    }
}

export const annotateUnprocessableThreads = async (unprocessableThreads: types.UnprocessableThread[], contentFilter: types.ContentFilter) => {
    for (const thread of unprocessableThreads) {
        const dataSpanPrefix = `${process.env.PLASMO_PUBLIC_APP_NAME}-${thread.path}`
        const dataSpanName = `${dataSpanPrefix}-unprocessableThread`

        // Delete all existing data spans for the thread so we can create new ones. This will also delete out
        // of date information for the thread. For example, if it was pending and then was successfully
        // processed, this will delete the pending annotation so that both are not present in the DOM.
        ;[...document.querySelectorAll(`span[name^=${CSS.escape(dataSpanName)}]`)].map((span) => span.remove())

        let dataSpan = document.createElement("span")
        dataSpan.setAttribute("name", dataSpanName)
        dataSpan.title = `reason: ${thread.reason}`
        dataSpan.innerText = " ❔"

        getThreadTitleElement(thread.path).insertAdjacentElement("beforeend", dataSpan)
    }
}

export const annotateIgnoredRedditors = async (
    ignoredRedditors: types.IgnoredRedditor[],
    usernameElementsMap,
    contentFilter: types.ContentFilter
) => {
    for (const ignoredRedditor of ignoredRedditors) {
        const username = ignoredRedditor.username
        const dataSpanPrefix = `${process.env.PLASMO_PUBLIC_APP_NAME}-${username}`
        const dataSpanName = `${dataSpanPrefix}-ignoredRedditor`

        if (username in usernameElementsMap) {
            // Delete all existing data spans for the user so we can create new ones. This will also delete out
            // of date information for the username. For example, if it was pending and then was successfully
            // processed, this will delete the pending annotation so that both are not present in the DOM.
            ;[...document.querySelectorAll(`span[name^=${dataSpanPrefix}]`)].map((span) => span.remove())

            let dataSpan = document.createElement("span")
            dataSpan.setAttribute("name", dataSpanName)
            dataSpan.style.color = "yellow"
            dataSpan.title = `reason: ${ignoredRedditor.reason}`
            dataSpan.innerText = " [ignored]"

            for (let linkElement of usernameElementsMap[username]) {
                linkElement.parentElement.insertAdjacentElement("beforeend", dataSpan.cloneNode(true))
            }
        }
    }
}

export const annotatePendingRedditors = async (
    pendingRedditors: types.PendingRedditor[],
    usernameElementsMap,
    contentFilter: types.ContentFilter
) => {
    for (const pendingRedditor of pendingRedditors) {
        const username = pendingRedditor.username
        const dataSpanPrefix = `${process.env.PLASMO_PUBLIC_APP_NAME}-${username}`
        const dataSpanName = `${dataSpanPrefix}-pendingRedditor`

        if (username in usernameElementsMap) {
            // Delete all existing data spans for the user so we can create new ones. This will also delete out
            // of date information for the username. For example, if it was pending and then was successfully
            // processed, this will delete the pending annotation so that both are not present in the DOM.
            ;[...document.querySelectorAll(`span[name^=${dataSpanPrefix}]`)].map((span) => span.remove())

            let dataSpan = document.createElement("span")
            dataSpan.setAttribute("name", dataSpanName)
            dataSpan.style.color = "yellow"

            dataSpan.title = `Submitted for processing`
            dataSpan.innerText = ` [pending]`

            for (let linkElement of usernameElementsMap[username]) {
                linkElement.parentElement.insertAdjacentElement("beforeend", dataSpan.cloneNode(true))
            }
        }
    }
}

export const annotateProcessedRedditors = async (processedRedditors: types.Redditor[], usernameElementsMap, contentFilter: types.ContentFilter) => {
    for (const processedRedditor of processedRedditors) {
        const username = processedRedditor.username
        const dataSpanPrefix = `${process.env.PLASMO_PUBLIC_APP_NAME}-${username}`
        const dataSpanName = `${dataSpanPrefix}-processedRedditor`

        if (username in usernameElementsMap) {
            // Delete all existing data spans for the user so we can create new ones. This will also delete out
            // of date information for the username. For example, if it was pending and then was successfully
            // processed, this will delete the pending annotation so that both are not present in the DOM.
            ;[...document.querySelectorAll(`span[name^=${dataSpanPrefix}]`)].map((span) => span.remove())

            let dataSpan = document.createElement("span")
            dataSpan.setAttribute("name", dataSpanName)
            dataSpan.style.color = "yellow"

            const age = processedRedditor.data.age.value
            const iq = processedRedditor.data.iq.value

            dataSpan.title = [
                `processed: ${processedRedditor.data.created}`,
                `age: ${age}`,
                `iq: ${iq}`,
                `interests ${processedRedditor.data.interests.value}`,
                `sentiment_polarity: ${processedRedditor.data.sentiment_polarity.value}`,
                `sentiment_subjectivity: ${processedRedditor.data.sentiment_subjectivity.value}`,
                `total_inputs: ${processedRedditor.data.total_inputs}`,
                `summary: ${processedRedditor.data.summary.value}`
            ].join("\u000d")

            dataSpan.innerText = ` [age=${age}, iq=${iq}]`

            for (let linkElement of usernameElementsMap[username]) {
                linkElement.parentElement.insertAdjacentElement("beforeend", dataSpan.cloneNode(true))
            }
        }
    }
}

export const annotateUnprocessableRedditors = async (
    unprocessableRedditors: types.UnprocessableRedditor[],
    usernameElementsMap,
    contentFilter: types.ContentFilter
) => {
    for (const unprocessableRedditor of unprocessableRedditors) {
        const username = unprocessableRedditor.username
        const dataSpanPrefix = `${process.env.PLASMO_PUBLIC_APP_NAME}-${username}`
        const dataSpanName = `${dataSpanPrefix}-unprocessableRedditor`

        if (username in usernameElementsMap) {
            // Delete all existing data spans for the user so we can create new ones. This will also delete out
            // of date information for the username. For example, if it was pending and then was successfully
            // processed, this will delete the pending annotation so that both are not present in the DOM.
            ;[...document.querySelectorAll(`span[name^=${dataSpanPrefix}]`)].map((span) => span.remove())

            let dataSpan = document.createElement("span")
            dataSpan.setAttribute("name", dataSpanName)
            dataSpan.style.color = "yellow"
            dataSpan.title = `reason: ${unprocessableRedditor.reason}`
            dataSpan.innerText = " [unprocessable]"

            for (let linkElement of usernameElementsMap[username]) {
                linkElement.parentElement.insertAdjacentElement("beforeend", dataSpan.cloneNode(true))
            }
        }
    }
}

const getThreadRowElement = (urlPath: string) => {
    return document.querySelector(`[data-permalink="${urlPath}"]`) as HTMLDivElement
}

const getThreadRowElements = () => {
    return document.querySelectorAll("[data-permalink]:not(.comment, .ad-container)") as NodeListOf<HTMLDivElement>
}

const getThreadTitleElement = (urlPath: string) => {
    return getThreadRowElement(urlPath).querySelector('[data-event-action="title"]') as HTMLLinkElement
}

export const getThreadUrlPaths = () => {
    return [...getThreadRowElements()].map((el) => el.getAttribute("data-permalink")) as string[]
}

const getUsernameElements = () => {
    return document.getElementsByClassName("author") as HTMLCollectionOf<HTMLLinkElement>
}

export const getUsernameElementsMap = () => {
    let usernameElements = {}
    for (const el of getUsernameElements()) {
        const username = el.innerText
        username in usernameElements ? usernameElements[username].push(el) : (usernameElements[username] = [el])
    }
    return usernameElements
}
