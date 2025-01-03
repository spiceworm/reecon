import { sendToBackground } from "@plasmohq/messaging"

import type * as types from "~util/types"

export const openAiApiKeyIsUsable = async (apiKey: string): Promise<boolean> => {
    const resp = await sendToBackground({
        name: "misc",
        body: {
            action: "openAiApiKeyIsUsable",
            kwargs: {
                apiKey: apiKey
            }
        }
    })
    return resp.message as boolean
}

export const processRedditorData = async (producerSettings: object, usernames: string[]) => {
    const resp = await sendToBackground({
        name: "reddit",
        body: {
            action: "processRedditorData",
            kwargs: {
                producerSettings: producerSettings,
                usernames: usernames
            }
        }
    })
    return resp.message as types.SubmitRedditorDataResponse
}

export const processThreadData = async (producerSettings: object, urlPaths: string[]) => {
    const resp = await sendToBackground({
        name: "reddit",
        body: {
            action: "processThreadData",
            kwargs: {
                producerSettings: producerSettings,
                urlPaths: urlPaths
            }
        }
    })
    return resp.message as types.SubmitThreadDataResponse
}
