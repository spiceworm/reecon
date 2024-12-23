import type { PlasmoCSConfig } from "plasmo"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as constants from "~util/constants"
import * as dom from "~util/dom"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const config: PlasmoCSConfig = {
    matches: ["https://*.reddit.com/r/*/comments/*", "https://*.reddit.com/user/*/", "https://*.reddit.com/user/*/comments/"],
    exclude_matches: ["https://*.reddit.com/user/*/submitted/"],
    run_at: "document_idle"
}

const CommentFilters = () => {
    const [activeContentFilter] = useStorage<types.ContentFilter>(
        {
            instance: storage.extLocalStorage,
            key: constants.ACTIVE_CONTENT_FILTER
        },
        (v) => (v === undefined ? constants.defaultContentFilter : v)
    )

    const [ageFilterEnabled] = useStorage<boolean>(
        {
            instance: storage.extLocalStorage,
            key: constants.AGE_CONTENT_FILTER_ENABLED
        },
        (v) => (v === undefined ? false : v)
    )
    const [iqFilterEnabled] = useStorage<boolean>(
        {
            instance: storage.extLocalStorage,
            key: constants.IQ_CONTENT_FILTER_ENABLED
        },
        (v) => (v === undefined ? false : v)
    )
    const [sentimentPolarityFilterEnabled] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.SENTIMENT_POLARITY_CONTENT_FILTER_ENABLED },
        (v) => (v === undefined ? false : v)
    )
    const [sentimentSubjectivityFilterEnabled] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.SENTIMENT_SUBJECTIVITY_CONTENT_FILTER_ENABLED },
        (v) => (v === undefined ? false : v)
    )

    const [ignoredRedditors] = useStorage<Record<string, types.CachedIgnoredRedditor>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_IGNORED_REDDITORS },
        (v) => (v === undefined ? {} : v)
    )
    const [processedRedditors] = useStorage<Record<string, types.CachedProcessedRedditor>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_PROCESSED_REDDITORS },
        (v) => (v === undefined ? {} : v)
    )
    const [unprocessableRedditors] = useStorage<Record<string, types.CachedUnprocessableRedditor>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_UNPROCESSABLE_REDDITORS },
        (v) => (v === undefined ? {} : v)
    )
    const [processedThreads] = useStorage<Record<string, types.CachedProcessedThread>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_PROCESSED_THREADS },
        (v) => (v === undefined ? {} : v)
    )
    const [unprocessableThreads] = useStorage<Record<string, types.CachedUnprocessableThread>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_UNPROCESSABLE_THREADS },
        (v) => (v === undefined ? {} : v)
    )

    let hiddenUsernames = new Set<string>()
    let shownUsernames = new Set<string>()

    console.log(`running comments filter CS at ${new Date()}`)

    Object.keys(dom.getUsernameElementsMap()).map((username) => {
        if (username in processedRedditors) {
            const obj = processedRedditors[username]

            if (ageFilterEnabled && obj.value.data.age.value < activeContentFilter.age) {
                hiddenUsernames.add(username)
            } else if (iqFilterEnabled && obj.value.data.iq.value < activeContentFilter.iq) {
                hiddenUsernames.add(username)
            } else if (sentimentPolarityFilterEnabled && obj.value.data.sentiment_polarity.value < activeContentFilter.sentimentPolarity) {
                hiddenUsernames.add(username)
            } else if (
                sentimentSubjectivityFilterEnabled &&
                obj.value.data.sentiment_subjectivity.value < activeContentFilter.sentimentSubjectivity
            ) {
                hiddenUsernames.add(username)
            } else {
                shownUsernames.add(username)
            }
        } else if (username in ignoredRedditors) {
        } else if (username in unprocessableRedditors) {
        }
    })

    if (hiddenUsernames.size > 0 || shownUsernames.size > 0) {
        dom.setCommentVisibility(hiddenUsernames, shownUsernames)
    }
}

export default CommentFilters
