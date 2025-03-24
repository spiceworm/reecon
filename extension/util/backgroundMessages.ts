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
    return resp.message
}

export const processRedditorData = async (
    llmProvidersSettings: types.LlmProvidersSettings,
    usernames: string[]
): Promise<types.SubmitRedditorDataResponse> => {
    const resp = await sendToBackground({
        name: "reddit",
        body: {
            action: "processRedditorData",
            kwargs: {
                llmProvidersSettings: llmProvidersSettings,
                usernames: usernames
            }
        }
    })
    return resp.message
}

export const processThreadData = async (
    llmProvidersSettings: types.LlmProvidersSettings,
    urlPaths: string[]
): Promise<types.SubmitThreadDataResponse> => {
    const resp = await sendToBackground({
        name: "reddit",
        body: {
            action: "processThreadData",
            kwargs: {
                llmProvidersSettings: llmProvidersSettings,
                urlPaths: urlPaths
            }
        }
    })
    return resp.message
}
