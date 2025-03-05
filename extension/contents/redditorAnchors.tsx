import DOMPurify from "dompurify"
import parse from "html-react-parser"
import type { PlasmoCSConfig, PlasmoCSUIContainerProps, PlasmoGetInlineAnchorList } from "plasmo"
import { createRoot } from "react-dom/client"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as constants from "~util/constants"
import * as dom from "~util/dom"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const config: PlasmoCSConfig = {
    matches: ["https://*.reddit.com/*"],
    run_at: "document_idle"
}

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
    const anchors = dom.getPostTaglineParagraphElements()
    return [...anchors].map((element) => ({
        element,
        insertPosition: "beforeend"
    }))
}

export const getRootContainer = dom.getCSUIRootContainer

export const render = async ({ anchor, createRootContainer }) => {
    const rootContainer = await createRootContainer(anchor)
    const root = createRoot(rootContainer)
    root.render(<RedditorAnchor anchor={anchor} />)
}

const RedditorAnchor = (props: PlasmoCSUIContainerProps) => {
    const [cachedIgnoredRedditors] = useStorage<Record<string, types.CachedIgnoredRedditor>>(
        {
            instance: storage.extLocalStorage,
            key: constants.CACHED_IGNORED_REDDITORS
        },
        (v) => (v === undefined ? {} : v)
    )
    const [cachedPendingRedditors] = useStorage<Record<string, types.CachedPendingRedditor>>(
        {
            instance: storage.extLocalStorage,
            key: constants.CACHED_PENDING_REDDITORS
        },
        (v) => (v === undefined ? {} : v)
    )
    const [cachedProcessedRedditors] = useStorage<Record<string, types.CachedProcessedRedditor>>(
        {
            instance: storage.extLocalStorage,
            key: constants.CACHED_PROCESSED_REDDITORS
        },
        (v) => (v === undefined ? {} : v)
    )
    const [cachedUnprocessableRedditors] = useStorage<Record<string, types.CachedUnprocessableRedditor>>(
        {
            instance: storage.extLocalStorage,
            key: constants.CACHED_UNPROCESSABLE_REDDITORS
        },
        (v) => (v === undefined ? {} : v)
    )
    const [disableExtension] = useStorage<boolean>({ instance: storage.extLocalStorage, key: constants.DISABLE_EXTENSION }, (v) =>
        v === undefined ? false : v
    )

    const postTaglineParagraphElement = props.anchor.element as HTMLParagraphElement
    const redditorUsernameLinkElement = postTaglineParagraphElement.querySelector(".author") as HTMLLinkElement
    const redditorUsername = redditorUsernameLinkElement.innerText

    const cachedIgnored = cachedIgnoredRedditors[redditorUsername]
    const cachedPending = cachedPendingRedditors[redditorUsername]
    const cachedProcessed = cachedProcessedRedditors[redditorUsername]
    const cachedUnprocessable = cachedUnprocessableRedditors[redditorUsername]

    if (disableExtension) {
        return
    }

    const el = dom.getOrCreateCSUIInlineElement(redditorUsername)

    if (cachedIgnored) {
        const ignoredRedditor = cachedIgnored.value
        // TODO: find an appropriate CSS style for ignored redditors
        el.style.filter = "none"
        el.title = `[ignored] ${ignoredRedditor.reason}`
    } else if (cachedProcessed) {
        const processedRedditor = cachedProcessed.value
        el.style.filter = "none"
        el.title = [
            `processed: ${processedRedditor.data.created}`,
            `age: ${processedRedditor.data.age.value}`,
            `iq: ${processedRedditor.data.iq.value}`,
            `interests: ${processedRedditor.data.interests.value}`,
            `sentiment_polarity: ${processedRedditor.data.sentiment_polarity.value}`,
            `sentiment_subjectivity: ${processedRedditor.data.sentiment_subjectivity.value}`,
            `total_inputs: ${processedRedditor.data.total_inputs}`,
            `summary: ${processedRedditor.data.summary.value}`
        ].join("\u000d")
    } else if (cachedUnprocessable) {
        const unprocessableRedditor = cachedUnprocessable.value
        el.style.filter = "invert(0.5)"
        el.title = `[unprocessable] ${unprocessableRedditor.reason}`
    } else if (cachedPending) {
        const pendingRedditor = cachedPending.value
        el.style.filter = "grayscale(1)"
        el.title = "[pending] submitted for processing"
    } else {
        return
    }

    return parse(DOMPurify.sanitize(el.outerHTML))
}
