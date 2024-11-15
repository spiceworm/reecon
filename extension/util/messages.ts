import { sendToBackground } from "@plasmohq/messaging"

import type * as types from "~util/types"

export const processRedditorsData = async (producerSettings: object, usernames: string[]) => {
    const resp = await sendToBackground({
        name: "reddit",
        body: {
            action: "processRedditorsData",
            kwargs: {
                producerSettings: producerSettings,
                usernames: usernames
            }
        }
    })
    return resp.message as types.ProcessRedditorsDataResponse
}

export const processThreadsData = async (producerSettings: object, urlPaths: string[]) => {
    const resp = await sendToBackground({
        name: "reddit",
        body: {
            action: "processThreadsData",
            kwargs: {
                producerSettings: producerSettings,
                urlPaths: urlPaths
            }
        }
    })
    return resp.message as types.ProcessThreadsDataResponse
}
