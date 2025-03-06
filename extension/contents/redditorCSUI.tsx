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
    const [disableExtension] = useStorage<boolean>({ instance: storage.extLocalStorage, key: constants.DISABLE_EXTENSION }, (v) =>
        v === undefined ? false : v
    )

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

    const [activeFilter] = useStorage<types.CommentFilter>(
        {
            instance: storage.extLocalStorage,
            key: constants.ACTIVE_COMMENT_FILTER
        },
        (v) => (v === undefined ? constants.defaultCommentFilter : v)
    )
    const [ageFilterEnabled] = useStorage<boolean>(
        {
            instance: storage.extLocalStorage,
            key: constants.COMMENT_AGE_CONTENT_FILTER_ENABLED
        },
        (v) => (v === undefined ? false : v)
    )
    const [iqFilterEnabled] = useStorage<boolean>(
        {
            instance: storage.extLocalStorage,
            key: constants.COMMENT_IQ_CONTENT_FILTER_ENABLED
        },
        (v) => (v === undefined ? false : v)
    )
    const [sentimentPolarityFilterEnabled] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.COMMENT_SENTIMENT_POLARITY_CONTENT_FILTER_ENABLED },
        (v) => (v === undefined ? false : v)
    )
    const [sentimentSubjectivityFilterEnabled] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.COMMENT_SENTIMENT_SUBJECTIVITY_CONTENT_FILTER_ENABLED },
        (v) => (v === undefined ? false : v)
    )

    const [hideIgnoredRedditorsEnabled] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.HIDE_IGNORED_REDDITORS_ENABLED },
        (v) => (v === undefined ? false : v)
    )
    const [hideUnprocessableRedditorsEnabled] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.HIDE_UNPROCESSABLE_REDDITORS_ENABLED },
        (v) => (v === undefined ? false : v)
    )

    if (disableExtension) {
        return
    }

    const postTaglineParagraphElement = props.anchor.element as HTMLParagraphElement
    const redditorComment: HTMLDivElement = postTaglineParagraphElement.closest("div[id]")
    const redditorUsernameLinkElement: HTMLLinkElement = postTaglineParagraphElement.querySelector(".author")
    const redditorUsername = redditorUsernameLinkElement.innerText

    const cachedIgnored = cachedIgnoredRedditors[redditorUsername]
    const cachedPending = cachedPendingRedditors[redditorUsername]
    const cachedProcessed = cachedProcessedRedditors[redditorUsername]
    const cachedUnprocessable = cachedUnprocessableRedditors[redditorUsername]

    const inlineEl = dom.getOrCreateCSUIInlineElement(redditorUsername)
    let shouldHideComment = false

    if (cachedIgnored) {
        const ignoredRedditor = cachedIgnored.value
        // TODO: find an appropriate CSS style for ignored redditors
        inlineEl.style.filter = "none"
        inlineEl.title = `[ignored] ${ignoredRedditor.reason}`

        shouldHideComment = hideIgnoredRedditorsEnabled
    } else if (cachedProcessed) {
        const processedRedditor = cachedProcessed.value
        inlineEl.style.filter = "none"
        inlineEl.title = [
            `processed: ${processedRedditor.data.created}`,
            `age: ${processedRedditor.data.age.value}`,
            `iq: ${processedRedditor.data.iq.value}`,
            `interests: ${processedRedditor.data.interests.value}`,
            `sentiment_polarity: ${processedRedditor.data.sentiment_polarity.value}`,
            `sentiment_subjectivity: ${processedRedditor.data.sentiment_subjectivity.value}`,
            `total_inputs: ${processedRedditor.data.total_inputs}`,
            `summary: ${processedRedditor.data.summary.value}`
        ].join("\u000d")

        shouldHideComment = [
            ageFilterEnabled && processedRedditor.data.age.value < activeFilter.age,
            iqFilterEnabled && processedRedditor.data.iq.value < activeFilter.iq,
            sentimentPolarityFilterEnabled && processedRedditor.data.sentiment_polarity.value < activeFilter.sentimentPolarity,
            sentimentSubjectivityFilterEnabled && processedRedditor.data.sentiment_subjectivity.value < activeFilter.sentimentSubjectivity
        ].some((shouldHide) => shouldHide)
    } else if (cachedUnprocessable) {
        const unprocessableRedditor = cachedUnprocessable.value
        inlineEl.style.filter = "invert(0.5)"
        inlineEl.title = `[unprocessable] ${unprocessableRedditor.reason}`

        shouldHideComment = hideUnprocessableRedditorsEnabled
    } else if (cachedPending) {
        const pendingRedditor = cachedPending.value
        inlineEl.style.filter = "grayscale(1)"
        inlineEl.title = "[pending] submitted for processing"
    } else {
        return
    }

    if (shouldHideComment) {
        redditorComment.setAttribute(`${process.env.PLASMO_PUBLIC_APP_NAME}-comment-filter`, "true")
        redditorComment.classList.remove("noncollapsed")
        redditorComment.classList.add("collapsed")
    } else {
        redditorComment.setAttribute(`${process.env.PLASMO_PUBLIC_APP_NAME}-comment-filter`, "false")
        redditorComment.classList.remove("collapsed")
        redditorComment.classList.add("noncollapsed")
    }

    return parse(DOMPurify.sanitize(inlineEl.outerHTML))
}
