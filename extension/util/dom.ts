import * as storage from "~util/storage"
import type * as types from "~util/types"

export const annotatePendingThreads = async (pendingThreads: types.PendingThread[], contentFilter: types.ContentFilter) => {
    for (const thread of pendingThreads) {
        const dataSpanID = `${process.env.PLASMO_PUBLIC_APP_NAME}-pendingThread-${thread.path}`

        // Delete existing data span so it can be recreated
        document.getElementById(dataSpanID)?.remove()

        let dataSpan = document.createElement("span")
        dataSpan.setAttribute("id", dataSpanID)
        dataSpan.title = "Submitted for processing"
        dataSpan.innerText = " 🕒"

        getThreadTitleElement(thread.path).insertAdjacentElement("beforeend", dataSpan)
    }
}

export const annotateProcessedThreads = async (processedThreads: types.Thread[], contentFilter: types.ContentFilter) => {
    for (const thread of processedThreads) {
        const threadRow = getThreadRowElement(thread.path)
        const dataSpanID = `${process.env.PLASMO_PUBLIC_APP_NAME}-processedThread-${thread.path}`

        // Delete existing data span so it can be recreated
        document.getElementById(dataSpanID)?.remove()

        let dataSpan = document.createElement("span")
        dataSpan.setAttribute("id", dataSpanID)

        const sentiment_polarity = thread.data.sentiment_polarity.value
        const sentiment_subjectivity = thread.data.sentiment_subjectivity.value
        const summary = thread.data.summary.value
        dataSpan.title = `polarity: ${sentiment_polarity}\u000dsubjectivity: ${sentiment_subjectivity}\u000dsummary: ${summary}\u000d\u000d${JSON.stringify(thread.data, null, 4)}`
        dataSpan.innerText = " 🔮"

        getThreadTitleElement(thread.path).insertAdjacentElement("beforeend", dataSpan)

        if (sentiment_polarity < contentFilter.sentiment) {
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
        const dataSpanID = `${process.env.PLASMO_PUBLIC_APP_NAME}-unprocessableThread-${thread.path}`

        // Delete existing data span so it can be recreated
        document.getElementById(dataSpanID)?.remove()

        let dataSpan = document.createElement("span")
        dataSpan.setAttribute("id", dataSpanID)
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
        const dataSpanName = `${process.env.PLASMO_PUBLIC_APP_NAME}-ignoredRedditor-${username}`

        if (username in usernameElementsMap) {
            // Delete existing data spans so we can create new ones
            ;[...document.getElementsByName(dataSpanName)].map((span) => span.remove())

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
        const dataSpanName = `${process.env.PLASMO_PUBLIC_APP_NAME}-pendingRedditor-${username}`

        if (username in usernameElementsMap) {
            // Delete existing data spans so we can create new ones
            ;[...document.getElementsByName(dataSpanName)].map((span) => span.remove())

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
        const dataSpanName = `${process.env.PLASMO_PUBLIC_APP_NAME}-processedRedditor-${username}`

        if (username in usernameElementsMap) {
            // Delete existing data spans so we can create new ones
            ;[...document.getElementsByName(dataSpanName)].map((span) => span.remove())

            let dataSpan = document.createElement("span")
            dataSpan.setAttribute("name", dataSpanName)
            dataSpan.style.color = "yellow"

            const age = processedRedditor.data.age.value
            const iq = processedRedditor.data.iq.value
            const sentiment_polarity = processedRedditor.data.sentiment_polarity.value
            const sentiment_subjectivity = processedRedditor.data.sentiment_subjectivity.value
            const summary = processedRedditor.data.summary.value
            dataSpan.title = `age: ${age}\u000diq: ${iq}\u000dpolarity: ${sentiment_polarity}\u000dsubjectivity: ${sentiment_subjectivity}\u000dsummary: ${summary}\u000d\u000d${JSON.stringify(processedRedditor.data, null, 4)}`
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
        const dataSpanName = `${process.env.PLASMO_PUBLIC_APP_NAME}-unprocessableRedditor-${username}`

        if (username in usernameElementsMap) {
            // Delete existing data spans so we can create new ones
            ;[...document.getElementsByName(dataSpanName)].map((span) => span.remove())

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
