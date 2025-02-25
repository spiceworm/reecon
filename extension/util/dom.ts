import icon from "data-base64:~assets/icon16.png"

import type * as types from "~util/types"

const getOrCreateDataImg = (identifier: string) => {
    const dataImgName = `${process.env.PLASMO_PUBLIC_APP_NAME}-${identifier}`
    let dataImg: HTMLImageElement = document.querySelector(`img[name=${CSS.escape(dataImgName)}]`)

    if (!dataImg) {
        dataImg = document.createElement("img")
        dataImg.setAttribute("name", dataImgName)
        dataImg.src = icon
        dataImg.style.cursor = "pointer"
    }

    dataImg.style.filter = "none"
    return dataImg
}

export const annotatePendingThreads = async (pendingThreads: types.PendingThread[]) => {
    for (const thread of pendingThreads) {
        let dataImg = getOrCreateDataImg(thread.path)
        dataImg.title = "[pending] submitted for processing"
        dataImg.style.filter = "grayscale(1)"

        const titleElement = getThreadTitleElement(thread.path)
        titleElement.parentElement.insertBefore(dataImg, titleElement)
    }
}

export const annotateProcessedThreads = async (processedThreads: types.Thread[]) => {
    for (const thread of processedThreads) {
        let dataImg = getOrCreateDataImg(thread.path)

        dataImg.title = [
            `processed: ${thread.data.created}`,
            `keywords: ${thread.data.keywords.value}`,
            `sentiment_polarity: ${thread.data.sentiment_polarity.value}`,
            `sentiment_subjectivity: ${thread.data.sentiment_subjectivity.value}`,
            `total_inputs: ${thread.data.total_inputs}`,
            `summary: ${thread.data.summary.value}`
        ].join("\u000d")

        const titleElement = getThreadTitleElement(thread.path)
        titleElement.parentElement.insertBefore(dataImg, titleElement)
    }
}

export const annotateUnprocessableThreads = async (unprocessableThreads: types.UnprocessableThread[]) => {
    for (const thread of unprocessableThreads) {
        let dataImg = getOrCreateDataImg(thread.path)
        dataImg.title = `[unprocessable] ${thread.reason}`
        dataImg.style.filter = "invert(0.5)"

        const titleElement = getThreadTitleElement(thread.path)
        titleElement.parentElement.insertBefore(dataImg, titleElement)
    }
}

export const annotateIgnoredRedditors = async (ignoredRedditors: types.IgnoredRedditor[], usernameElementsMap) => {
    for (const ignoredRedditor of ignoredRedditors.filter((ignoredRedditor) => ignoredRedditor.username in usernameElementsMap)) {
        const username = ignoredRedditor.username
        let dataImg = getOrCreateDataImg(username)
        dataImg.title = `[ignored] ${ignoredRedditor.reason}`
        dataImg.style.filter = "opacity(50%)"

        usernameElementsMap[username].map((linkElement: HTMLLinkElement) => linkElement.parentElement.insertBefore(dataImg, linkElement))
    }
}

export const annotatePendingRedditors = async (pendingRedditors: types.PendingRedditor[], usernameElementsMap) => {
    for (const pendingRedditor of pendingRedditors.filter((pendingRedditor) => pendingRedditor.username in usernameElementsMap)) {
        const username = pendingRedditor.username
        let dataImg = getOrCreateDataImg(username)
        dataImg.title = "[pending] submitted for processing"
        dataImg.style.filter = "grayscale(1)"

        usernameElementsMap[username].map((linkElement: HTMLLinkElement) => linkElement.parentElement.insertBefore(dataImg, linkElement))
    }
}

export const annotateProcessedRedditors = async (processedRedditors: types.Redditor[], usernameElementsMap) => {
    for (const processedRedditor of processedRedditors.filter((processedRedditor) => processedRedditor.username in usernameElementsMap)) {
        const username = processedRedditor.username
        let dataImg = getOrCreateDataImg(username)
        const age = processedRedditor.data.age.value
        const iq = processedRedditor.data.iq.value

        dataImg.title = [
            `processed: ${processedRedditor.data.created}`,
            `age: ${age}`,
            `iq: ${iq}`,
            `interests ${processedRedditor.data.interests.value}`,
            `sentiment_polarity: ${processedRedditor.data.sentiment_polarity.value}`,
            `sentiment_subjectivity: ${processedRedditor.data.sentiment_subjectivity.value}`,
            `total_inputs: ${processedRedditor.data.total_inputs}`,
            `summary: ${processedRedditor.data.summary.value}`
        ].join("\u000d")

        usernameElementsMap[username].map((linkElement: HTMLLinkElement) => linkElement.parentElement.insertBefore(dataImg, linkElement))
    }
}

export const annotateUnprocessableRedditors = async (unprocessableRedditors: types.UnprocessableRedditor[], usernameElementsMap) => {
    for (const unprocessableRedditor of unprocessableRedditors.filter(
        (unprocessableRedditor) => unprocessableRedditor.username in usernameElementsMap
    )) {
        const username = unprocessableRedditor.username

        let dataImg = getOrCreateDataImg(username)
        dataImg.title = `[unprocessable] ${unprocessableRedditor.reason}`
        dataImg.style.filter = "invert(0.5)"

        usernameElementsMap[username].map((linkElement: HTMLLinkElement) => linkElement.parentElement.insertBefore(dataImg, linkElement))
    }
}

const getThreadRowElement = (urlPath: string): HTMLDivElement => {
    return document.querySelector(`[data-permalink="${urlPath}"]`)
}

const getThreadRowElements = (): NodeListOf<HTMLDivElement> => {
    return document.querySelectorAll("[data-permalink]:not(.comment, .ad-container)")
}

export const getThreadRowElementsMap = (): Record<string, HTMLDivElement[]> => {
    let threadElements: Record<string, HTMLDivElement[]> = {}
    for (const el of getThreadRowElements()) {
        const urlPath = el.getAttribute("data-permalink")
        urlPath in threadElements ? threadElements[urlPath].push(el) : (threadElements[urlPath] = [el])
    }
    return threadElements
}

const getThreadTitleElement = (urlPath: string): HTMLLinkElement => {
    return getThreadRowElement(urlPath).querySelector('[data-event-action="title"]')
}

export const getThreadUrlPaths = (): string[] => {
    return [...getThreadRowElements()].map((el) => el.getAttribute("data-permalink"))
}

export const getThreadTitleFromUrlPath = (urlPath: string): string => {
    return getThreadTitleElement(urlPath).innerText
}

const getUsernameElements = (): HTMLCollectionOf<HTMLLinkElement> => {
    return document.getElementsByClassName("author") as HTMLCollectionOf<HTMLLinkElement>
}

export const getUsernameElementsMap = (): Record<string, HTMLLinkElement[]> => {
    let usernameElements: Record<string, HTMLLinkElement[]> = {}
    for (const el of getUsernameElements()) {
        const username = el.innerText
        username in usernameElements ? usernameElements[username].push(el) : (usernameElements[username] = [el])
    }
    return usernameElements
}

export const setCommentVisibility = (hiddenUsernames: Set<string>, shownUsernames: Set<string>) => {
    Object.entries(getUsernameElementsMap()).map(([username, linkElements]) => {
        linkElements.map((linkElement) => {
            const commentRow: HTMLDivElement | null = linkElement.closest('div[data-type="comment"]')

            if (commentRow !== null) {
                if (hiddenUsernames.has(username)) {
                    commentRow.classList.remove("noncollapsed")
                    commentRow.classList.add("collapsed")
                } else if (shownUsernames.has(username)) {
                    commentRow.classList.remove("collapsed")
                    commentRow.classList.add("noncollapsed")
                }
            }
        })
    })
}

export const setThreadVisibility = (hiddenUrlPaths: Set<string>, shownUrlPaths: Set<string>) => {
    Object.entries(getThreadRowElementsMap()).map(([urlPath, divElements]) => {
        divElements.map((divElement) => {
            if (hiddenUrlPaths.has(urlPath)) {
                divElement.style.display = "none"
            } else if (shownUrlPaths.has(urlPath)) {
                divElement.style.display = "block"
            }
        })
    })
}
