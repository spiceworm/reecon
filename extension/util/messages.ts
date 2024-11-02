import {sendToBackground} from "@plasmohq/messaging"

import type * as types from "~util/types"


export const getIgnoredRedditors = async () => {
    const resp = await sendToBackground({
        name: "reddit",
        body: {
            action: 'getIgnoredRedditors'
        },
    })
    return resp.message as types.IgnoredRedditor[]
}


export const processRedditors = async (producerSettings: object, usernames: string[], ignoredUsernames: Set<string>) => {
    const resp = await sendToBackground({
        name: "reddit",
        body: {
            action: 'processRedditors',
            kwargs: {
                producerSettings: producerSettings,
                usernames: usernames,
                ignoredUsernames: ignoredUsernames,
            }
        },
    })
    return resp.message as types.Redditor[]
}


export const processThreads = async (producerSettings: object, urlPaths: string[]) => {
    const resp = await sendToBackground({
        name: "reddit",
        body: {
            action: 'processThreads',
            kwargs: {
                producerSettings: producerSettings,
                urlPaths: urlPaths,
            }
        },
    })
    return resp.message as types.Thread[]
}


    return resp.message as types.Thread[]
}
