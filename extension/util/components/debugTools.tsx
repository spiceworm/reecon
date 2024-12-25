import { useStorage } from "@plasmohq/storage/dist/hook"

import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const CheckStorageSize = () => {
    const [ignoredRedditors] = useStorage<Record<string, types.CachedIgnoredRedditor>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_IGNORED_REDDITORS },
        (v) => (v === undefined ? {} : v)
    )
    const [pendingRedditors] = useStorage<Record<string, types.CachedPendingRedditor>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_PENDING_REDDITORS },
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

    const [pendingThreads] = useStorage<Record<string, types.CachedPendingThread>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_PENDING_THREADS },
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

    return (
        <>
            <p>ignoredRedditors = {Object.keys(ignoredRedditors).length}</p>
            <p>pendingRedditors = {Object.keys(pendingRedditors).length}</p>
            <p>processedRedditors = {Object.keys(processedRedditors).length}</p>
            <p>unprocessableRedditors = {Object.keys(unprocessableRedditors).length}</p>
            <p>pendingThreads = {Object.keys(pendingThreads).length}</p>
            <p>processedThreads = {Object.keys(processedThreads).length}</p>
            <p>unprocessableThreads = {Object.keys(unprocessableThreads).length}</p>
        </>
    )
}
