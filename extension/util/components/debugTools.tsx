import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type {
    CachedIgnoredRedditor,
    CachedPendingRedditor,
    CachedPendingThread,
    CachedProcessedRedditor,
    CachedProcessedThread,
    CachedUnprocessableRedditor,
    CachedUnprocessableThread
} from "~util/types/extension/cache"

export const CheckStorageSize = () => {
    const [ignoredRedditors] = useStorage<Record<string, CachedIgnoredRedditor>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_IGNORED_REDDITORS },
        (v) => (v === undefined ? {} : v)
    )
    const [pendingRedditors] = useStorage<Record<string, CachedPendingRedditor>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_PENDING_REDDITORS },
        (v) => (v === undefined ? {} : v)
    )
    const [processedRedditors] = useStorage<Record<string, CachedProcessedRedditor>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_PROCESSED_REDDITORS },
        (v) => (v === undefined ? {} : v)
    )
    const [unprocessableRedditors] = useStorage<Record<string, CachedUnprocessableRedditor>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_UNPROCESSABLE_REDDITORS },
        (v) => (v === undefined ? {} : v)
    )

    const [pendingThreads] = useStorage<Record<string, CachedPendingThread>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_PENDING_THREADS },
        (v) => (v === undefined ? {} : v)
    )
    const [processedThreads] = useStorage<Record<string, CachedProcessedThread>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_PROCESSED_THREADS },
        (v) => (v === undefined ? {} : v)
    )
    const [unprocessableThreads] = useStorage<Record<string, CachedUnprocessableThread>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_UNPROCESSABLE_THREADS },
        (v) => (v === undefined ? {} : v)
    )

    return (
        <Stack spacing={2}>
            {[
                { label: "Ignored Redditors", obj: ignoredRedditors },
                { label: "Pending Redditors", obj: pendingRedditors },
                { label: "Processed Redditors", obj: processedRedditors },
                { label: "Unprocessable Redditors", obj: unprocessableRedditors },
                { label: "Pending Threads", obj: pendingThreads },
                { label: "Processed Threads", obj: processedThreads },
                { label: "Unprcessable Threads", obj: unprocessableThreads }
            ].map((item) => (
                <Typography>
                    {item.label}: {Object.keys(item.obj).length}
                </Typography>
            ))}
        </Stack>
    )
}
