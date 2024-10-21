import {jwtDecode} from "jwt-decode"
import lscache from "lscache"

import * as data from "~util/storage"
import type * as types from "~util/types"


export const apiRequest = async (urlPath: string, type: string, body: object = {}, authenticated= false) => {
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
    let options = {
        method: type,
        headers: headers,
    }

    if (authenticated) {
        const auth: types.Auth = await data.storage.get('auth')
        headers['Authorization'] = `Bearer ${auth.access}`
    }
    if (type.toLowerCase() !== 'get') {
        options['body'] = JSON.stringify(body)
    }

    return fetch(`${process.env.PLASMO_PUBLIC_BASE_URL}${urlPath}`, options)
}


export const apiAuthRequest = async (urlPath: string, type: string, body: object = {}) => {
    return apiRequest(urlPath, type, body, true)
}


export const getJson = async (urlPath: string) => {
    return apiRequest(urlPath, 'GET').then(response => response.json())
}


export const ensureAccessToken = async (refreshUrlPath): Promise<string | null> => {
    const auth: types.Auth = await data.storage.get('auth')

    if (auth !== null) {
        if (jwtIsValid(auth.access)) {
            return auth.access;
        }

        if (jwtIsValid(auth.refresh)) {
            const response = await apiRequest(
                refreshUrlPath,
                'post',
                {'refresh': auth.refresh},
            )

            if (response.ok) {
                const refreshJson = await response.json()
                await data.storage.set('auth', {access: refreshJson.access, refresh: refreshJson.refresh})
                return refreshJson.access
            } else {
                throw new Error(`Refreshing access token failed (${response.status})`)
            }
        }
    }
}


// This should only be invoked from a background message
export const getIgnoredRedditors = async () => {
    lscache.setBucket('api-data')
    lscache.flushExpired()

    let cachedIgnoredRedditors: types.IgnoredRedditor[] = lscache.get('ignoredRedditors')

    if (cachedIgnoredRedditors !== null && cachedIgnoredRedditors.length > 0) {
        return cachedIgnoredRedditors
    } else {
        const response = await apiAuthRequest(
            '/api/v1/reddit/redditors/ignored/',
            'GET',
        )

        if (response.ok) {
            const ignoredRedditors: types.IgnoredRedditor[] = await response.json()
            lscache.set('ignoredRedditors', ignoredRedditors, process.env.PLASMO_PUBLIC_IGNORED_REDDITOR_CACHE_EXP_MINUTES)
            return ignoredRedditors
        } else {
            throw new Error(`Fetching ignored redditors failed (${response.status})`)
        }
    }
}


function jwtIsValid(token: string | null) {
    if (token === null) {
        return false;
    } else {
        const jwt = jwtDecode(token);
        return Date.now() < jwt.exp * 1000;
    }
}


export const loginRequest = async (body: object) => {
    const response = await apiRequest(`/api/v1/auth/token/`, 'post', body)

    if (response.ok) {
        const responseJson = await response.json()
        await data.storage.set('auth', {access: responseJson.access, refresh: responseJson.refresh})
        return responseJson.access
    } else {
        throw new Error(`Login failed (${response.status})`)
    }
}


export const signupRequest = async (body: object) => {
    const response = await apiRequest(`/api/v1/auth/signup/`, 'post', body)

    if (response.ok) {
        return await loginRequest(body)
    } else {
        throw new Error(`Signup failed (${response.status})`)
    }
}


// set difference until Set.prototype.difference` is available
const difference = <T>(a: Set<T>, b: Set<T>) => new Set([...a].filter(x => !b.has(x)));


// This should only be invoked from a background message
export const processRedditors = async (usernames: string[], ignoredUsernames: Set<string>) => {
    lscache.setBucket('redditors')
    lscache.flushExpired()

    lscache.setBucket('pending-redditors')
    lscache.flushExpired()

    let cachedRedditors: types.Redditor[] = []
    let usernamesToProcess: string[] = []

    for (const username of usernames) {
        if (!ignoredUsernames.has(username)) {
            lscache.setBucket('redditors')
            const cachedRedditor: types.Redditor = lscache.get(username)

            lscache.setBucket('pending-redditors')
            const usernameSubmissionIsPending = lscache.get(username) === true

            if (cachedRedditor !== null) {
                cachedRedditors.push(cachedRedditor)
            } else if (!usernameSubmissionIsPending) {
                usernamesToProcess.push(username)
            }
        }
    }

    if (usernamesToProcess.length > 0) {
        const response = await apiAuthRequest(
            '/api/v1/reddit/redditors/',
            'POST',
            {'usernames': usernamesToProcess},
        )

        if (response.ok) {
            const redditors: types.Redditor[] = await response.json()

            lscache.setBucket('redditors')
            redditors.map(redditor => lscache.set(redditor.username, redditor, process.env.PLASMO_PUBLIC_REDDITOR_CACHE_EXP_MINUTES))

            const submittedUsernames = new Set(usernamesToProcess)
            const processedUsernames = new Set(redditors.map(redditor => redditor.username))
            const pendingUsernames = difference(submittedUsernames, processedUsernames)

            lscache.setBucket('pending-redditors')
            Array.from(pendingUsernames).map(username => lscache.set(username, true, 1))

            return redditors.concat(cachedRedditors)
        } else {
            console.error(response)
        }
    } else {
        return cachedRedditors
    }
}


// This should only be invoked from a background message
export const processThreads = async (urlPaths: string[]) => {
    lscache.setBucket('threads')
    lscache.flushExpired()

    lscache.setBucket('pending-threads')
    lscache.flushExpired()

    let cachedThreads: types.Thread[] = []
    let urlPathsToProcess: string[] = []

    for (const urlPath of urlPaths) {
        lscache.setBucket('threads')
        const cachedThread: types.Thread = lscache.get(urlPath)

        lscache.setBucket('pending-threads')
        const threadSubmissionIsPending = lscache.get(urlPath) === true

        if (cachedThread !== null) {
            cachedThreads.push(cachedThread)
        } else if (!threadSubmissionIsPending) {
            urlPathsToProcess.push(urlPath)
        }
    }

    if (urlPathsToProcess.length > 0) {
        const response = await apiAuthRequest(
            '/api/v1/reddit/threads/',
            'POST',
            {'paths': urlPathsToProcess},
        )

        if (response.ok) {
            const threads: types.Thread[] = await response.json()

            lscache.setBucket('threads')
            threads.map(thread => lscache.set(thread.path, thread, process.env.PLASMO_PUBLIC_THREAD_CACHE_EXP_MINUTES))

            const submittedUrlPaths = new Set(urlPathsToProcess)
            const processedUrlPaths = new Set(threads.map(thread => thread.path))
            const pendingUrlPaths = difference(submittedUrlPaths, processedUrlPaths)

            lscache.setBucket('pending-threads')
            Array.from(pendingUrlPaths).map(urlPath => lscache.set(urlPath, true, 1))

            return threads.concat(cachedThreads)
        } else {
            console.error(response)
        }
    } else {
        return cachedThreads
    }
}
