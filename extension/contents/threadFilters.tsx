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
    const [activeContentFilter] = useStorage<types.CommentContentFilter>(
        {
            instance: storage.extLocalStorage,
            key: constants.ACTIVE_COMMENT_CONTENT_FILTER
        },
        (v) => (v === undefined ? constants.defaultCommentContentFilter : v)
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
}

export default ThreadFilters
