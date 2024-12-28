import type { PlasmoCSConfig } from "plasmo"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as constants from "~util/constants"
import * as dom from "~util/dom"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const config: PlasmoCSConfig = {
    matches: ["https://*.reddit.com/", "https://*.reddit.com/r/*/", "https://*.reddit.com/user/*/"],
    exclude_matches: ["https://*.reddit.com/r/*/comments/*", "https://*.reddit.com/user/*/comments/"],
    run_at: "document_idle"
}

const ThreadFilters = () => {
    const [activeFilter] = useStorage<types.ThreadFilter>(
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

    const [processedThreads] = useStorage<Record<string, types.CachedProcessedThread>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_PROCESSED_THREADS },
        (v) => (v === undefined ? {} : v)
    )
    const [unprocessableThreads] = useStorage<Record<string, types.CachedUnprocessableThread>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_UNPROCESSABLE_THREADS },
        (v) => (v === undefined ? {} : v)
    )

    let hiddenUrlPaths = new Set<string>()
    let shownUrlPaths = new Set<string>()

    console.log(`running threads filter CS at ${new Date()}`)

    Object.keys(dom.getThreadRowElementsMap()).map((urlPath) => {
        if (urlPath in processedThreads) {
            const obj = processedThreads[urlPath]

            if (sentimentPolarityFilterEnabled && obj.value.data.sentiment_polarity.value < activeFilter.sentimentPolarity) {
                hiddenUrlPaths.add(urlPath)
            } else if (sentimentSubjectivityFilterEnabled && obj.value.data.sentiment_subjectivity.value < activeFilter.sentimentSubjectivity) {
                hiddenUrlPaths.add(urlPath)
            } else {
                shownUrlPaths.add(urlPath)
            }
        } else if (urlPath in unprocessableThreads) {
            if (hideUnprocessableThreadsEnabled) {
                hiddenUrlPaths.add(urlPath)
            } else {
                shownUrlPaths.add(urlPath)
            }
        }
    })

    if (hiddenUrlPaths.size > 0 || shownUrlPaths.size > 0) {
        dom.setThreadVisibility(hiddenUrlPaths, shownUrlPaths)
    }
}

export default ThreadFilters
