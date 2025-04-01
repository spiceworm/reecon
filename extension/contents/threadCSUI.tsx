import DOMPurify from "dompurify"
import parse from "html-react-parser"
import type { PlasmoCSConfig, PlasmoCSUIContainerProps, PlasmoGetInlineAnchorList } from "plasmo"
import { createRoot } from "react-dom/client"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as constants from "~util/constants"
import * as dom from "~util/dom"
import * as storage from "~util/storage"
import type { CachedPendingThread, CachedProcessedThread, CachedUnprocessableThread } from "~util/types/extension/cache"
import type { ThreadFilter } from "~util/types/extension/types"

export const config: PlasmoCSConfig = {
    matches: ["https://*.reddit.com/*"],
    run_at: "document_idle"
}

// 'Magic' plasmo function
export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
    const anchors = dom.getThreadTitleElements()
    return [...anchors].map((element) => ({
        element,
        insertPosition: "beforeend"
    }))
}

// 'Magic' plasmo function
export const getRootContainer = dom.getCSUIRootContainer

// 'Magic' plasmo function
export const render = async ({ anchor, createRootContainer }) => {
    const rootContainer = await createRootContainer(anchor)
    const root = createRoot(rootContainer)
    root.render(<ThreadAnchor anchor={anchor} />)
}

const ThreadAnchor = (props: PlasmoCSUIContainerProps) => {
    const [disableExtension] = useStorage<boolean>({ instance: storage.extLocalStorage, key: constants.DISABLE_EXTENSION }, (v) =>
        v === undefined ? false : v
    )

    const [cachedPendingThreads] = useStorage<Record<string, CachedPendingThread>>(
        {
            instance: storage.extLocalStorage,
            key: constants.CACHED_PENDING_THREADS
        },
        (v) => (v === undefined ? {} : v)
    )
    const [cachedProcessedThreads] = useStorage<Record<string, CachedProcessedThread>>(
        {
            instance: storage.extLocalStorage,
            key: constants.CACHED_PROCESSED_THREADS
        },
        (v) => (v === undefined ? {} : v)
    )
    const [cachedUnprocessableThreads] = useStorage<Record<string, CachedUnprocessableThread>>(
        {
            instance: storage.extLocalStorage,
            key: constants.CACHED_UNPROCESSABLE_THREADS
        },
        (v) => (v === undefined ? {} : v)
    )

    const [activeFilter] = useStorage<ThreadFilter>(
        {
            instance: storage.extLocalStorage,
            key: constants.ACTIVE_THREAD_FILTER
        },
        (v) => (v === undefined ? constants.defaultThreadFilter : v)
    )
    const [sentimentPolarityFilterEnabled] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.THREAD_SENTIMENT_POLARITY_CONTENT_FILTER_ENABLED },
        (v) => (v === undefined ? false : v)
    )
    const [sentimentSubjectivityFilterEnabled] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.THREAD_SENTIMENT_SUBJECTIVITY_CONTENT_FILTER_ENABLED },
        (v) => (v === undefined ? false : v)
    )
    const [hideUnprocessableThreadsEnabled] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.HIDE_UNPROCESSABLE_THREADS_ENABLED },
        (v) => (v === undefined ? false : v)
    )

    const threadTitleEl = props.anchor.element as HTMLLinkElement
    const threadRow: HTMLDivElement = threadTitleEl.closest("div[id]")
    const threadUrlPath = threadRow.getAttribute("data-permalink")

    const cachedPending = cachedPendingThreads[threadUrlPath]
    const cachedProcessed = cachedProcessedThreads[threadUrlPath]
    const cachedUnprocessable = cachedUnprocessableThreads[threadUrlPath]

    const { created, element: inlineEl } = dom.getOrCreateCSUIInlineElement(threadUrlPath)
    let shouldHideThreadRow = false

    if (cachedProcessed) {
        const processedThread = cachedProcessed.value
        inlineEl.style.filter = "none"
        inlineEl.title = [
            `processed: ${processedThread.data.created}`,
            `keywords: ${processedThread.data.keywords.value}`,
            `sentiment_polarity: ${processedThread.data.sentiment_polarity.value}`,
            `sentiment_subjectivity: ${processedThread.data.sentiment_subjectivity.value}`,
            `total_inputs: ${processedThread.data.total_inputs}`,
            `summary: ${processedThread.data.summary.value}`
        ].join("\u000d")

        shouldHideThreadRow = [
            sentimentPolarityFilterEnabled && processedThread.data.sentiment_polarity.value < activeFilter.sentimentPolarity,
            sentimentSubjectivityFilterEnabled && processedThread.data.sentiment_subjectivity.value < activeFilter.sentimentSubjectivity
        ].some((shouldHide) => shouldHide)
    } else if (cachedUnprocessable) {
        const unprocessableThread = cachedUnprocessable.value
        inlineEl.style.filter = "invert(0.5)"
        inlineEl.title = `[unprocessable] ${unprocessableThread.reason}`

        shouldHideThreadRow = hideUnprocessableThreadsEnabled
    } else if (cachedPending) {
        const pendingThread = cachedPending.value
        inlineEl.style.filter = "grayscale(1)"
        inlineEl.title = "[pending] thread submitted for processing"
    } else {
        return
    }

    if (shouldHideThreadRow && !disableExtension) {
        threadRow.setAttribute(`${process.env.PLASMO_PUBLIC_APP_NAME}-thread-filter`, "true")
        threadRow.style.display = "none"
    } else {
        threadRow.setAttribute(`${process.env.PLASMO_PUBLIC_APP_NAME}-thread-filter`, "false")
        threadRow.style.display = "block"
    }

    inlineEl.style.display = disableExtension ? "none" : "inline-block"

    return parse(DOMPurify.sanitize(inlineEl.outerHTML))
}
