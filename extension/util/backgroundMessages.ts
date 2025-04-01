import { sendToBackground } from "@plasmohq/messaging"

import type { LlmProvidersSettings, RedditorDataResponse, ThreadDataResponse } from "~util/types/backend/server/apiSerializers"

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

export const processRedditorData = async (llmProvidersSettings: LlmProvidersSettings, usernames: string[]): Promise<RedditorDataResponse> => {
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

export const processThreadData = async (llmProvidersSettings: LlmProvidersSettings, urlPaths: string[]): Promise<ThreadDataResponse> => {
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
