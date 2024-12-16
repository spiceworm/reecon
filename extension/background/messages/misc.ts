import OpenAI, { RateLimitError } from "openai"

import type { PlasmoMessaging } from "@plasmohq/messaging"

import * as storage from "~util/storage"

const openAiApiKeyIsUsable = async (apiKey: string) => {
    const client = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true })

    try {
        await client.chat.completions.create({
            messages: [{ role: "user", content: "PING" }],
            model: "gpt-4o-mini"
        })
        await storage.setExtensionStatusMessage("unusableOpenAiApiKey", false, "")
        return true
    } catch (error) {
        if (error instanceof RateLimitError) {
            await storage.setExtensionStatusMessage("unusableOpenAiApiKey", true, `OpenAI key is not usable. ${error.error.message}`)
        } else {
            console.error(`Unhandled OpenAI error caught`)
            console.error(error)
        }
        return false
    }
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const action: string = req.body.action

    if (action === "openAiApiKeyIsUsable") {
        const kwargs = req.body.kwargs
        const apiKey: string = kwargs.apiKey
        const message: boolean = await openAiApiKeyIsUsable(apiKey)
        res.send({ message })
    } else {
        console.error(`Unhandled message with action: ${action}`)
    }
}

export default handler
