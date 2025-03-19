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

// 'Magic' plasmo function
export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
    const anchors = dom.getSubmissionTaglineElements()
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

    const postTaglineEl = props.anchor.element as HTMLParagraphElement

    // Ignore comments from deleted redditors
    if (postTaglineEl.querySelector("em")?.innerText === "[deleted]") {
        return
    }

    const redditorUsernameEl: HTMLLinkElement = postTaglineEl.querySelector(".author")
    const redditorUsername = redditorUsernameEl.innerText

    const cachedIgnored = cachedIgnoredRedditors[redditorUsername]
    const cachedPending = cachedPendingRedditors[redditorUsername]
    const cachedProcessed = cachedProcessedRedditors[redditorUsername]
    const cachedUnprocessable = cachedUnprocessableRedditors[redditorUsername]

    const { created, element: inlineEl } = dom.getOrCreateCSUIInlineElement(redditorUsername)
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
        inlineEl.title = "[pending] redditor submitted for processing"
    } else {
        return
    }

    const submission: HTMLDivElement = postTaglineEl.closest("div[id]")
    const commentMd: HTMLDivElement | null = submission.querySelector("div[class=md]")

    // This content script runs on pages that show a list of thread rows as well as comments. Do not execute the below
    // code if the `submission` is a thread row element on a thread listing page. Only execute it if we are looking at
    // a page containing comments.
    if (commentMd) {
        const { created, element: commentFilterEl } = dom.getOrCreateCSUICommentFilterElement(submission.id)

        if (created) {
            commentMd.querySelectorAll("p").forEach((p) => commentFilterEl.appendChild(p))
            commentMd.appendChild(commentFilterEl)
        }

        if (shouldHideComment && !disableExtension) {
            commentFilterEl.style.display = "none"
        } else {
            commentFilterEl.style.display = "block"
        }
    }

    inlineEl.style.display = disableExtension ? "none" : "inline-block"

    return parse(DOMPurify.sanitize(inlineEl.outerHTML))
}
