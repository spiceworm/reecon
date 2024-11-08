import lscache from "lscache"

import * as storage from "~util/storage"
import type * as types from "~util/types"

const GET = "GET"
const POST = "POST"

const _apiRequest = async (urlPath: string, method: string, body: object = {}, sendAuthenticated = false): Promise<any> => {
    let headers = {
        Accept: "application/json",
        "Content-Type": "application/json"
    }
    let options = {
        method: method,
        headers: headers
    }

    if (sendAuthenticated) {
        const auth: types.Auth = await storage.getAuth()

        if (auth === null) {
            throw new Error(`User authentication missing. Cannot send authenticated ${method} request to ${urlPath}`)
        } else {
            headers["Authorization"] = `Bearer ${auth.access}`
        }
    }
    if (method.toUpperCase() !== GET) {
        options["body"] = JSON.stringify(body)
    }

    const response = await fetch(`${process.env.PLASMO_PUBLIC_BASE_URL}${urlPath}`, options)

    if (response.ok) {
        await storage.setExtensionStatusMessage("apiRequestError", false)
        return response.json()
    } else {
        console.error(response)
        const errorJson = await response.json()
        await storage.setExtensionStatusMessage("apiRequestError", true, `Error returned from API: ${errorJson.detail}`)
        throw new Error(JSON.stringify(errorJson))
    }
}

export const get = async (urlPath: string, sendAuthenticated: boolean = false): Promise<any> => {
    return _apiRequest(urlPath, GET, {}, sendAuthenticated)
}

export const authGet = async (urlPath: string): Promise<any> => {
    return get(urlPath, true)
}

export const post = async (urlPath: string, body: object, sendAuthenticated: boolean = false): Promise<any> => {
    return _apiRequest(urlPath, POST, body, sendAuthenticated)
}

const authPost = async (urlPath: string, body: object): Promise<any> => {
    return post(urlPath, body, true)
}

// This should only be invoked from a background message
export const getIgnoredRedditors = async (): Promise<types.IgnoredRedditor[]> => {
    lscache.setBucket("api-data")
    lscache.flushExpired()

    let cachedIgnoredRedditors: types.IgnoredRedditor[] = lscache.get("ignoredRedditors")

    if (cachedIgnoredRedditors !== null && cachedIgnoredRedditors.length > 0) {
        return cachedIgnoredRedditors
    }

    const ignoredRedditors: types.IgnoredRedditor[] = await authGet("/api/v1/reddit/redditors/ignored/")
    lscache.set("ignoredRedditors", ignoredRedditors, process.env.PLASMO_PUBLIC_IGNORED_REDDITOR_CACHE_EXP_MINUTES)
    return ignoredRedditors
}

// set difference until Set.prototype.difference` is available
const difference = <T>(a: Set<T>, b: Set<T>) => new Set([...a].filter((x) => !b.has(x)))

// This should only be invoked from a background message
export const processRedditors = async (
    producerSettings: types.ProducerSettings,
    usernames: string[],
    ignoredUsernames: Set<string>
): Promise<types.Redditor[]> => {
    lscache.setBucket("redditors")
    lscache.flushExpired()

    lscache.setBucket("pending-redditors")
    lscache.flushExpired()

    let cachedRedditors: types.Redditor[] = []
    let usernamesToProcess: string[] = []

    for (const username of usernames) {
        if (!ignoredUsernames.has(username)) {
            lscache.setBucket("redditors")
            const cachedRedditor: types.Redditor = lscache.get(username)

            lscache.setBucket("pending-redditors")
            const usernameSubmissionIsPending = lscache.get(username) === true

            if (cachedRedditor !== null) {
                cachedRedditors.push(cachedRedditor)
            } else if (!usernameSubmissionIsPending) {
                usernamesToProcess.push(username)
            }
        }
    }

    if (usernamesToProcess.length > 0) {
        const redditors: types.Redditor[] = await authPost("/api/v1/reddit/redditors/", {
            producer_settings: producerSettings,
            usernames: usernamesToProcess
        })

        lscache.setBucket("redditors")
        redditors.map((redditor) => lscache.set(redditor.username, redditor, process.env.PLASMO_PUBLIC_REDDITOR_CACHE_EXP_MINUTES))

        const submittedUsernames = new Set(usernamesToProcess)
        const processedUsernames = new Set(redditors.map((redditor) => redditor.username))
        const pendingUsernames = difference(submittedUsernames, processedUsernames)

        lscache.setBucket("pending-redditors")
        Array.from(pendingUsernames).map((username) => lscache.set(username, true, 1))

        return redditors.concat(cachedRedditors)
    }
    return cachedRedditors
}

// This should only be invoked from a background message
export const processThreads = async (producerSettings: types.ProducerSettings, urlPaths: string[]): Promise<types.Thread[]> => {
    lscache.setBucket("threads")
    lscache.flushExpired()

    lscache.setBucket("pending-threads")
    lscache.flushExpired()

    let cachedThreads: types.Thread[] = []
    let urlPathsToProcess: string[] = []

    for (const urlPath of urlPaths) {
        lscache.setBucket("threads")
        const cachedThread: types.Thread = lscache.get(urlPath)

        lscache.setBucket("pending-threads")
        const threadSubmissionIsPending = lscache.get(urlPath) === true

        if (cachedThread !== null) {
            cachedThreads.push(cachedThread)
        } else if (!threadSubmissionIsPending) {
            urlPathsToProcess.push(urlPath)
        }
    }

    if (urlPathsToProcess.length > 0) {
        const threads: types.Thread[] = await authPost("/api/v1/reddit/threads/", {
            producer_settings: producerSettings,
            paths: urlPathsToProcess
        })

        lscache.setBucket("threads")
        threads.map((thread) => lscache.set(thread.path, thread, process.env.PLASMO_PUBLIC_THREAD_CACHE_EXP_MINUTES))

        const submittedUrlPaths = new Set(urlPathsToProcess)
        const processedUrlPaths = new Set(threads.map((thread) => thread.path))
        const pendingUrlPaths = difference(submittedUrlPaths, processedUrlPaths)

        lscache.setBucket("pending-threads")
        Array.from(pendingUrlPaths).map((urlPath) => lscache.set(urlPath, true, 1))

        return threads.concat(cachedThreads)
    }
    return cachedThreads
}

export const updateApiStatusMessages = async (): Promise<void> => {
    try {
        const apiStatusMessages = await authGet("/api/v1/status/messages/")
        await storage.setApiStatusMessages(apiStatusMessages)
    } catch (error) {
        await storage.setApiStatusMessages([])
        throw error
    }
}
