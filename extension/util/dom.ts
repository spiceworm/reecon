import icon from "data-base64:~assets/icon12.png"
import type { PlasmoCSUIMountState } from "plasmo"

// https://github.com/PlasmoHQ/plasmo/issues/1008#issuecomment-2215020750
export const getCSUIRootContainer = ({ anchor, mountState }: { anchor; mountState: PlasmoCSUIMountState }) =>
    new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            let { element, onclick, insertPosition } = anchor
            if (element) {
                const rootContainer = document.createElement("span")
                rootContainer.style.display = "inline-block"
                rootContainer.style.marginInlineStart = "0.5rem"

                mountState.hostSet.add(rootContainer)
                mountState.hostMap.set(rootContainer, anchor)

                element.insertAdjacentElement(insertPosition, rootContainer)
                element.onclick = toggleSubmissionVisibility

                clearInterval(checkInterval)
                resolve(rootContainer)
            }
        }, 137)
    })

export const getOrCreateCSUICommentFilterElement = (identifier: string) => {
    let created = false
    const elementId = `${process.env.PLASMO_PUBLIC_APP_NAME}-comment-filter-${identifier}`
    let filterEl: HTMLSpanElement = document.getElementById(elementId)
    if (!filterEl) {
        created = true
        filterEl = document.createElement("span")
        filterEl.id = elementId
        filterEl.style.display = "block"
    }
    return { created: created, element: filterEl }
}

export const getOrCreateCSUIInlineElement = (identifier: string) => {
    let created = false
    const dataImgName = `${process.env.PLASMO_PUBLIC_APP_NAME}-inline-${identifier}`
    let inlineEl: HTMLSpanElement = document.querySelector(`span[name=${CSS.escape(dataImgName)}]`)
    if (!inlineEl) {
        created = true
        inlineEl = document.createElement("span")
        inlineEl.setAttribute("name", dataImgName)
        inlineEl.style.cursor = "pointer"

        let imgEl: HTMLImageElement = document.createElement("img")
        imgEl.src = icon

        inlineEl.appendChild(imgEl)
    }
    return { created: created, element: inlineEl }
}

// This will return an array of tagline elements for thread rows OR comments depending on the current page.
export const getSubmissionTaglineElements = (): HTMLParagraphElement[] => Array.from(document.querySelectorAll("p.tagline"))

const getThreadRowElement = (urlPath: string): HTMLDivElement => document.querySelector(`[data-permalink="${urlPath}"]`)

export const getThreadRowElements = (): HTMLDivElement[] => Array.from(document.querySelectorAll("[data-permalink]:not(.comment, .ad-container)"))

const getThreadTitleElement = (urlPath: string): HTMLLinkElement => getThreadRowElement(urlPath).querySelector('[data-event-action="title"]')

export const getThreadTitleElements = (): HTMLParagraphElement[] => Array.from(document.querySelectorAll("p.title"))

export const getThreadUrlPaths = (): string[] => getThreadRowElements().map((el) => el.getAttribute("data-permalink"))

export const getThreadTitleFromUrlPath = (urlPath: string): string => getThreadTitleElement(urlPath).innerText

export const getUsernameElements = (): HTMLLinkElement[] => Array.from(document.querySelectorAll(".author"))

export const getUsernames = (): string[] => [...new Set(getUsernameElements().map((el) => el.innerText))]

// Show/hide the visibility of a submission that may be hidden due to filter rules.
const toggleSubmissionVisibility = (event: PointerEvent) => {
    const anchorEl = event.target as HTMLDivElement
    const anchorId = anchorEl.closest("div[id]").id
    const filterEl = getOrCreateCSUICommentFilterElement(anchorId).element
    filterEl.style.display = filterEl.style.display === "none" ? "block" : "none"
}
