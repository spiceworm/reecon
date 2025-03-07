import icon from "data-base64:~assets/icon12.png"
import type { PlasmoCSUIMountState } from "plasmo"

// https://github.com/PlasmoHQ/plasmo/issues/1008#issuecomment-2215020750
export const getCSUIRootContainer = ({ anchor, mountState }: { anchor; mountState: PlasmoCSUIMountState }) =>
    new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            let { element, insertPosition } = anchor
            if (element) {
                const rootContainer = document.createElement("span")
                rootContainer.style.display = "inline-block"
                rootContainer.style.marginInlineStart = "0.5rem"

                mountState.hostSet.add(rootContainer)
                mountState.hostMap.set(rootContainer, anchor)

                element.insertAdjacentElement(insertPosition, rootContainer)

                clearInterval(checkInterval)
                resolve(rootContainer)
            }
        }, 137)
    })

export const getPostTaglineParagraphElements = (): HTMLParagraphElement[] => Array.from(document.querySelectorAll("p.tagline"))

export const getOrCreateCSUIInlineElement = (identifier: string) => {
    const dataImgName = `${process.env.PLASMO_PUBLIC_APP_NAME}-${identifier}`
    let inlineEl: HTMLSpanElement = document.querySelector(`span[name=${CSS.escape(dataImgName)}]`)
    if (!inlineEl) {
        inlineEl = document.createElement("span")
        inlineEl.setAttribute("name", dataImgName)
        inlineEl.style.cursor = "pointer"

        let imgEl: HTMLImageElement = document.createElement("img")
        imgEl.src = icon

        inlineEl.appendChild(imgEl)
    }
    return inlineEl
}

const getThreadRowElement = (urlPath: string): HTMLDivElement => document.querySelector(`[data-permalink="${urlPath}"]`)

export const getThreadRowElements = (): HTMLDivElement[] => Array.from(document.querySelectorAll("[data-permalink]:not(.comment, .ad-container)"))

const getThreadTitleElement = (urlPath: string): HTMLLinkElement => getThreadRowElement(urlPath).querySelector('[data-event-action="title"]')

export const getThreadTitleParagraphElements = (): HTMLParagraphElement[] => Array.from(document.querySelectorAll("p.title"))

export const getThreadUrlPaths = (): string[] => getThreadRowElements().map((el) => el.getAttribute("data-permalink"))

export const getThreadTitleFromUrlPath = (urlPath: string): string => getThreadTitleElement(urlPath).innerText

export const getUsernameElements = (): HTMLLinkElement[] => Array.from(document.querySelectorAll(".author"))

export const getUsernames = (): string[] => [...new Set(getUsernameElements().map((el) => el.innerText))]
