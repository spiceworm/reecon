import {sendToBackground} from "@plasmohq/messaging"

import type * as types from "~util/types"


export const getCurrentContext = async () => {
    const resp = await sendToBackground({
        name: "misc",
        body: {
            action: 'getCurrentContext'
        }
    })
    return resp.message as string
}


export const getIgnoredRedditors = async () => {
    const resp = await sendToBackground({
        name: "reddit",
        body: {
            action: 'getIgnoredRedditors'
        }
    })
    return resp.message as types.IgnoredRedditor[]
}


export const processRedditors = async (usernames: string[], ignoredUsernames: Set<string>) => {
    const resp = await sendToBackground({
        name: "reddit",
        body: {
            action: 'processRedditors',
            kwargs: {
                usernames: usernames,
                ignoredUsernames: ignoredUsernames,
            }
        }
    })
    return resp.message as types.Redditor[]
}


export const processThreads = async (urlPaths: string[]) => {
    const resp = await sendToBackground({
        name: "reddit",
        body: {
            action: 'processThreads',
            kwargs: {
                urlPaths: urlPaths,
            }
        }
    })
    return resp.message as types.Thread[]
}


export const setPopupIcon = async (color: string | null, text: string) => {
    const resp = await sendToBackground({
        name: "misc",
        body: {
            action: 'setPopupIcon',
            kwargs: {
                color: color,
                text: text,
            }
        }
    })
    return resp.message as null
}
