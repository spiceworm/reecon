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
    const anchors = dom.getThreadTitleParagraphElements()
    return [...anchors].map((element) => ({
        element,
        insertPosition: "beforeend"
    }))
}

export const getRootContainer = dom.getCSUIRootContainer

export const render = async ({ anchor, createRootContainer }) => {
    const rootContainer = await createRootContainer(anchor)
    const root = createRoot(rootContainer)
    root.render(<ThreadAnchor anchor={anchor} />)
}

const ThreadAnchor = (props: PlasmoCSUIContainerProps) => {
    const [cachedPendingThreads] = useStorage<Record<string, types.CachedPendingThread>>(
        {
            instance: storage.extLocalStorage,
            key: constants.CACHED_PENDING_THREADS
        },
        (v) => (v === undefined ? {} : v)
    )
    const [cachedProcessedThreads] = useStorage<Record<string, types.CachedProcessedThread>>(
        {
            instance: storage.extLocalStorage,
            key: constants.CACHED_PROCESSED_THREADS
        },
        (v) => (v === undefined ? {} : v)
    )
    const [cachedUnprocessableThreads] = useStorage<Record<string, types.CachedUnprocessableThread>>(
        {
            instance: storage.extLocalStorage,
            key: constants.CACHED_UNPROCESSABLE_THREADS
        },
        (v) => (v === undefined ? {} : v)
    )
    const [disableExtension] = useStorage<boolean>({ instance: storage.extLocalStorage, key: constants.DISABLE_EXTENSION }, (v) =>
        v === undefined ? false : v
    )

    const threadTitleLinkEl = props.anchor.element as HTMLLinkElement
    const threadRow: HTMLDivElement = threadTitleLinkEl.closest("div[id]")
    const threadUrlPath = threadRow.getAttribute("data-permalink")

    const cachedPending = cachedPendingThreads[threadUrlPath]
    const cachedProcessed = cachedProcessedThreads[threadUrlPath]
    const cachedUnprocessable = cachedUnprocessableThreads[threadUrlPath]

    if (disableExtension) {
        return
    }

    const el = dom.getOrCreateCSUIInlineElement(threadUrlPath)

    if (cachedProcessed) {
        const processedThread = cachedProcessed.value
        el.style.filter = "none"
        el.title = [
            `processed: ${processedThread.data.created}`,
            `keywords: ${processedThread.data.keywords.value}`,
            `sentiment_polarity: ${processedThread.data.sentiment_polarity.value}`,
            `sentiment_subjectivity: ${processedThread.data.sentiment_subjectivity.value}`,
            `total_inputs: ${processedThread.data.total_inputs}`,
            `summary: ${processedThread.data.summary.value}`
        ].join("\u000d")
    } else if (cachedUnprocessable) {
        const unprocessableThread = cachedUnprocessable.value
        el.style.filter = "invert(0.5)"
        el.title = `[unprocessable] ${unprocessableThread.reason}`
    } else if (cachedPending) {
        const pendingThread = cachedPending.value
        el.style.filter = "grayscale(1)"
        el.title = "[pending] submitted for processing"
    } else {
        return
    }

    return parse(DOMPurify.sanitize(el.outerHTML))
}
