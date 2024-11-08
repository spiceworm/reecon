import { sendToBackground } from "@plasmohq/messaging"

import type * as types from "~util/types"

export const processRedditors = async (producerSettings: object, usernames: string[]) => {
    const resp = await sendToBackground({
        name: "reddit",
        body: {
            action: "processRedditors",
            kwargs: {
                producerSettings: producerSettings,
                usernames: usernames
            }
        }
    })
    return resp.message as types.ProcessRedditorsResponse
}

export const processThreads = async (producerSettings: object, urlPaths: string[]) => {
    const resp = await sendToBackground({
        name: "reddit",
        body: {
            action: "processThreads",
            kwargs: {
                producerSettings: producerSettings,
                urlPaths: urlPaths
            }
        }
    })
    return resp.message as types.ProcessThreadsResponse
}
