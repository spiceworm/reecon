import type { PlasmoMessaging } from "@plasmohq/messaging"

import * as api from "~util/api"
import * as cache from "~util/storageCache"
import type {
    LlmProvidersSettings,
    RedditorDataRequest,
    RedditorDataResponse,
    ThreadDataRequest,
    ThreadDataResponse
} from "~util/types/backend/server/apiSerializers"
import type {
    CachedIgnoredRedditor,
    CachedPendingRedditor,
    CachedPendingThread,
    CachedProcessedRedditor,
    CachedProcessedThread,
    CachedUnprocessableRedditor,
    CachedUnprocessableThread
} from "~util/types/extension/cache"

const processRedditorData = async (llmProvidersSettings: LlmProvidersSettings, usernames: string[]): Promise<RedditorDataResponse> => {
    let allCachedIgnored = await cache.getIgnoredRedditors()
    const cachedIgnored = usernames.map((username) => allCachedIgnored[username]).filter((obj) => obj !== undefined)

    let allCachedPending = await cache.getPendingRedditors()
    let cachedPending = usernames.map((username) => allCachedPending[username]).filter((obj) => obj !== undefined)

    let allCachedProcessed = await cache.getProcessedRedditors()
    let cachedProcessed = usernames.map((username) => allCachedProcessed[username]).filter((obj) => obj !== undefined)

    let allCachedUnprocessable = await cache.getUnprocessableRedditors()
    let cachedUnprocessable = usernames.map((username) => allCachedUnprocessable[username]).filter((obj) => obj !== undefined)

    const cachedUsernames = [...cachedIgnored, ...cachedPending, ...cachedProcessed, ...cachedUnprocessable].map(
        (obj: CachedIgnoredRedditor | CachedPendingRedditor | CachedProcessedRedditor | CachedUnprocessableRedditor) => obj.value.username
    )

    const usernamesToProcess = new Set(usernames).difference(new Set(cachedUsernames))

    if (usernamesToProcess.size > 0) {
        let response: RedditorDataResponse = await api.authPost("/api/v1/reddit/redditor/data/", {
            llm_providers_settings: llmProvidersSettings,
            usernames: [...usernamesToProcess]
        } as RedditorDataRequest)

        response.ignored.map((obj) => {
            const expires = new Date()
            expires.setMinutes(expires.getMinutes() + parseInt(process.env.PLASMO_PUBLIC_IGNORED_REDDITOR_CACHE_EXP_MINUTES))
            allCachedIgnored[obj.username] = { expires: expires.toString(), value: obj } as CachedIgnoredRedditor

            // ignored is a finalized state, delete from pending cache
            delete allCachedPending[obj.username]
            delete cachedPending[obj.username]
        })

        response.pending.map((obj) => {
            const expires = new Date()
            expires.setMinutes(expires.getMinutes() + parseInt(process.env.PLASMO_PUBLIC_PENDING_REDDITOR_CACHE_EXP_MINUTES))
            allCachedPending[obj.username] = { expires: expires.toString(), value: obj } as CachedPendingRedditor
        })

        response.processed.map((obj) => {
            const expires = new Date()
            expires.setMinutes(expires.getMinutes() + parseInt(process.env.PLASMO_PUBLIC_PROCESSED_REDDITOR_CACHE_EXP_MINUTES))
            allCachedProcessed[obj.username] = { expires: expires.toString(), value: obj } as CachedProcessedRedditor

            // processed is a finalized state, delete from pending and unprocessable caches
            delete allCachedPending[obj.username]
            delete allCachedUnprocessable[obj.username]
            delete cachedPending[obj.username]
            delete cachedUnprocessable[obj.username]
        })

        response.unprocessable.map((obj) => {
            const expires = new Date()
            expires.setMinutes(expires.getMinutes() + parseInt(process.env.PLASMO_PUBLIC_UNPROCESSABLE_REDDITOR_CACHE_EXP_MINUTES))
            allCachedUnprocessable[obj.username] = { expires: expires.toString(), value: obj } as CachedUnprocessableRedditor

            // unprocessable is a medium term temporary state, delete from pending cache
            delete allCachedPending[obj.username]
            delete cachedPending[obj.username]
        })

        await Promise.all([
            cache.setIgnoredRedditors(allCachedIgnored),
            cache.setPendingRedditors(allCachedPending),
            cache.setProcessedRedditors(allCachedProcessed),
            cache.setUnprocessableRedditors(allCachedUnprocessable)
        ])

        return {
            ignored: [...response.ignored, ...cachedIgnored.map((obj) => obj.value)],
            pending: [...response.pending, ...cachedPending.map((obj) => obj.value)],
            processed: [...response.processed, ...cachedProcessed.map((obj) => obj.value)],
            unprocessable: [...response.unprocessable, ...cachedUnprocessable.map((obj) => obj.value)]
        }
    } else {
        return {
            ignored: cachedIgnored.map((obj) => obj.value),
            pending: cachedPending.map((obj) => obj.value),
            processed: cachedProcessed.map((obj) => obj.value),
            unprocessable: cachedUnprocessable.map((obj) => obj.value)
        }
    }
}

const processThreadData = async (llmProvidersSettings: LlmProvidersSettings, urlPaths: string[]): Promise<ThreadDataResponse> => {
    let allCachedPending = await cache.getPendingThreads()
    let cachedPending = urlPaths.map((urlPath) => allCachedPending[urlPath]).filter((obj) => obj !== undefined)

    let allCachedProcessed = await cache.getProcessedThreads()
    let cachedProcessed = urlPaths.map((urlPath) => allCachedProcessed[urlPath]).filter((obj) => obj !== undefined)

    let allCachedUnprocessable = await cache.getUnprocessableThreads()
    let cachedUnprocessable = urlPaths.map((urlPath) => allCachedUnprocessable[urlPath]).filter((obj) => obj !== undefined)

    const cachedUrlPaths = [...cachedPending, ...cachedProcessed, ...cachedUnprocessable].map(
        (obj: CachedPendingThread | CachedProcessedThread | CachedUnprocessableThread) => obj.value.path
    )

    const urlPathsToProcess = new Set(urlPaths).difference(new Set(cachedUrlPaths))

    if (urlPathsToProcess.size > 0) {
        let response: ThreadDataResponse = await api.authPost("/api/v1/reddit/thread/data/", {
            llm_providers_settings: llmProvidersSettings,
            paths: [...urlPathsToProcess]
        } as ThreadDataRequest)

        response.pending.map((obj) => {
            const expires = new Date()
            expires.setMinutes(expires.getMinutes() + parseInt(process.env.PLASMO_PUBLIC_PENDING_THREAD_CACHE_EXP_MINUTES))
            allCachedPending[obj.path] = { expires: expires.toString(), value: obj } as CachedPendingThread
        })

        response.processed.map((obj) => {
            const expires = new Date()
            expires.setMinutes(expires.getMinutes() + parseInt(process.env.PLASMO_PUBLIC_PROCESSED_THREAD_CACHE_EXP_MINUTES))
            allCachedProcessed[obj.path] = { expires: expires.toString(), value: obj } as CachedProcessedThread

            // processed is a finalized state, delete from pending and unprocessable caches
            delete allCachedPending[obj.path]
            delete allCachedUnprocessable[obj.path]
            delete cachedPending[obj.path]
            delete cachedUnprocessable[obj.path]
        })

        response.unprocessable.map((obj) => {
            const expires = new Date()
            expires.setMinutes(expires.getMinutes() + parseInt(process.env.PLASMO_PUBLIC_UNPROCESSABLE_THREAD_CACHE_EXP_MINUTES))
            allCachedUnprocessable[obj.path] = { expires: expires.toString(), value: obj } as CachedUnprocessableThread

            // unprocessable is a medium term temporary state, delete from pending cache
            delete allCachedPending[obj.path]
            delete cachedPending[obj.path]
        })

        await Promise.all([
            cache.setPendingThreads(allCachedPending),
            cache.setProcessedThreads(allCachedProcessed),
            cache.setUnprocessableThreads(allCachedUnprocessable)
        ])
        return {
            pending: [...response.pending, ...cachedPending.map((obj) => obj.value)],
            processed: [...response.processed, ...cachedProcessed.map((obj) => obj.value)],
            unprocessable: [...response.unprocessable, ...cachedUnprocessable.map((obj) => obj.value)]
        }
    } else {
        return {
            pending: cachedPending.map((obj) => obj.value),
            processed: cachedProcessed.map((obj) => obj.value),
            unprocessable: cachedUnprocessable.map((obj) => obj.value)
        }
    }
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const action: string = req.body.action

    if (action === "processRedditorData") {
        const kwargs = req.body.kwargs
        const llmProvidersSettings: LlmProvidersSettings = kwargs.llmProvidersSettings
        const usernames: string[] = kwargs.usernames
        const message: RedditorDataResponse = await processRedditorData(llmProvidersSettings, usernames)
        res.send({ message })
    } else if (action === "processThreadData") {
        const kwargs = req.body.kwargs
        const llmProvidersSettings: LlmProvidersSettings = kwargs.llmProvidersSettings
        const urlPaths: string[] = kwargs.urlPaths
        const message: ThreadDataResponse = await processThreadData(llmProvidersSettings, urlPaths)
        res.send({ message })
    } else {
        console.error(`Unhandled message with action: ${action}`)
    }
}

export default handler
