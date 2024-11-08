import lscache from "lscache"

import type { PlasmoMessaging } from "@plasmohq/messaging"

import * as api from "~util/api"
import type * as types from "~util/types"

// set difference until Set.prototype.difference` is available
const difference = <T>(a: Set<T>, b: Set<T>) => new Set([...a].filter((x) => !b.has(x)))

const processRedditors = async (producerSettings: types.ProducerSettings[], usernames: string[]): Promise<types.ProcessRedditorsResponse> => {
    const IGNORED_BUCKET = "redditors-ignored"
    const PENDING_BUCKET = "redditors-pending"
    const PROCESSED_BUCKET = "redditors-processed"
    const UNPROCESSABLE_BUCKET = "redditors-unprocessable"

    lscache.setBucket(IGNORED_BUCKET)
    lscache.flushExpired()
    const cachedIgnored: types.IgnoredRedditor[] = usernames
        .map((username) => lscache.get(username))
        .filter((redditor: types.IgnoredRedditor) => redditor !== null)

    lscache.setBucket(PENDING_BUCKET)
    lscache.flushExpired()
    const cachedPending: types.PendingRedditor[] = usernames
        .map((username) => lscache.get(username))
        .filter((redditor: types.PendingRedditor) => redditor !== null)

    lscache.setBucket(PROCESSED_BUCKET)
    lscache.flushExpired()
    const cachedProcessed: types.Redditor[] = usernames
        .map((username) => lscache.get(username))
        .filter((redditor: types.Redditor) => redditor !== null)

    lscache.setBucket(UNPROCESSABLE_BUCKET)
    lscache.flushExpired()
    const cachedUnprocessable: types.UnprocessableRedditor[] = usernames
        .map((username) => lscache.get(username))
        .filter((redditor: types.UnprocessableRedditor) => redditor !== null)

    const cachedUsernames = []
        .concat(...cachedIgnored, ...cachedPending, ...cachedProcessed, ...cachedUnprocessable)
        .map((redditorObj: types.IgnoredRedditor | types.Redditor | types.UnprocessableRedditor) => redditorObj.username)

    const usernamesToProcess = [...difference(new Set(usernames), new Set(cachedUsernames))]

    if (usernamesToProcess.length === 0) {
        return {
            ignored: cachedIgnored,
            pending: cachedPending,
            processed: cachedProcessed,
            unprocessable: cachedUnprocessable
        }
    } else {
        let response: types.ProcessRedditorsResponse = await api.authPost("/api/v1/reddit/redditors/", {
            producer_settings: producerSettings,
            usernames: usernamesToProcess
        })

        lscache.setBucket(IGNORED_BUCKET)
        response.ignored.map((redditor) => lscache.set(redditor.username, redditor, process.env.PLASMO_PUBLIC_REDDITOR_CACHE_EXP_MINUTES))

        lscache.setBucket(PENDING_BUCKET)
        response.pending.map((redditor) => lscache.set(redditor.username, redditor, 1))

        lscache.setBucket(PROCESSED_BUCKET)
        response.processed.map((redditor) => lscache.set(redditor.username, redditor, process.env.PLASMO_PUBLIC_REDDITOR_CACHE_EXP_MINUTES))

        lscache.setBucket(UNPROCESSABLE_BUCKET)
        response.unprocessable.map((redditor) => lscache.set(redditor.username, redditor, process.env.PLASMO_PUBLIC_REDDITOR_CACHE_EXP_MINUTES))

        response.ignored.push(...cachedIgnored)
        response.pending.push(...cachedPending)
        response.processed.push(...cachedProcessed)
        response.unprocessable.push(...cachedUnprocessable)

        return response
    }
}

const processThreads = async (producerSettings: types.ProducerSettings[], urlPaths: string[]): Promise<types.ProcessThreadsResponse> => {
    const PENDING_BUCKET = "thread-pending"
    const PROCESSED_BUCKET = "thread-processed"
    const UNPROCESSABLE_BUCKET = "threads-unprocessable"

    lscache.setBucket(PENDING_BUCKET)
    lscache.flushExpired()
    const cachedPending: types.PendingThread[] = urlPaths
        .map((urlPath) => lscache.get(urlPath))
        .filter((thread: types.PendingThread) => thread !== null)

    lscache.setBucket(PROCESSED_BUCKET)
    lscache.flushExpired()
    const cachedProcessed: types.Thread[] = urlPaths.map((urlPath) => lscache.get(urlPath)).filter((thread: types.Thread) => thread !== null)

    lscache.setBucket(UNPROCESSABLE_BUCKET)
    lscache.flushExpired()
    const cachedUnprocessable: types.UnprocessableThread[] = urlPaths
        .map((urlPath) => lscache.get(urlPath))
        .filter((thread: types.UnprocessableThread) => thread !== null)

    const cachedUrlPaths = []
        .concat(...cachedPending, ...cachedProcessed, ...cachedUnprocessable)
        .map((threadObj: types.PendingThread | types.Thread | types.UnprocessableThread) => threadObj.path)

    const urlPathsToProcess = [...difference(new Set(urlPaths), new Set(cachedUrlPaths))]

    if (urlPathsToProcess.length === 0) {
        return {
            pending: cachedPending,
            processed: cachedProcessed,
            unprocessable: cachedUnprocessable
        }
    } else {
        let processThreadsResponse: types.ProcessThreadsResponse = await api.authPost("/api/v1/reddit/threads/", {
            producer_settings: producerSettings,
            paths: urlPathsToProcess
        })

        lscache.setBucket(PENDING_BUCKET)
        processThreadsResponse.pending.map((thread) => lscache.set(thread.path, thread, 1))

        lscache.setBucket(PROCESSED_BUCKET)
        processThreadsResponse.processed.map((thread) => lscache.set(thread.path, thread, process.env.PLASMO_PUBLIC_THREAD_CACHE_EXP_MINUTES))

        lscache.setBucket(UNPROCESSABLE_BUCKET)
        processThreadsResponse.unprocessable.map((thread) => lscache.set(thread.path, thread, 5))

        processThreadsResponse.pending.push(...cachedPending)
        processThreadsResponse.processed.push(...cachedProcessed)
        processThreadsResponse.unprocessable.push(...cachedUnprocessable)

        return processThreadsResponse
    }
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const action: string = req.body.action

    if (action === "processRedditors") {
        const kwargs = req.body.kwargs
        const producerSettings: types.ProducerSettings[] = kwargs.producerSettings
        const usernames: string[] = kwargs.usernames
        const message: types.ProcessRedditorsResponse = await processRedditors(producerSettings, usernames)
        res.send({ message })
    } else if (action === "processThreads") {
        const kwargs = req.body.kwargs
        const producerSettings: types.ProducerSettings[] = kwargs.producerSettings
        const urlPaths: string[] = kwargs.urlPaths
        const message: types.ProcessThreadsResponse = await processThreads(producerSettings, urlPaths)
        res.send({ message })
    } else {
        console.error(`Unhandled message with action: ${action}`)
    }
}

export default handler
