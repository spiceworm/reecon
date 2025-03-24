import TextField from "@mui/material/TextField"
import OpenAI from "openai"
import { useState } from "react"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as constants from "~util/constants"
import * as storage from "~util/storage"

const LlmProvidersSettingsApiKeyInput = ({ name, apiKeyStorageKey, apiKeyValidatorFunc }) => {
    const [showKeyValidationError, setShowKeyValidationError] = useState(false)
    const [apiKey, _, { setRenderValue, setStoreValue }] = useStorage<string>(
        {
            instance: storage.extLocalStorage,
            key: apiKeyStorageKey
        },
        (v) => (v === undefined ? "" : v)
    )

    const validateApiKey = async (e) => {
        const apiKeyEntry = e.target.value

        if (apiKeyEntry.length === 0) {
            // Allow user to delete an existing key
            setShowKeyValidationError(false)
            await setStoreValue(apiKeyEntry)
        } else {
            if (await apiKeyValidatorFunc(apiKeyEntry)) {
                setShowKeyValidationError(false)
                await setStoreValue(apiKeyEntry)
            } else {
                setShowKeyValidationError(true)
            }
        }
    }

    return (
        <TextField
            error={showKeyValidationError}
            onBlur={validateApiKey}
            onChange={(e) => setRenderValue(e.target.value)}
            helperText={showKeyValidationError ? `Invalid ${name} API key` : ""}
            label={`${name} API Key`}
            value={apiKey}
        />
    )
}

export const LlmProvidersSettingsInputs = () => {
    const llmProvidersSettings = [
        {
            name: "OpenAI",
            apiKeyStorageKey: constants.OPENAI_API_KEY,
            apiKeyValidatorFunc: async (apiKey: string): Promise<boolean> => {
                const client = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true })

                try {
                    await client.models.list()
                    return true
                } catch (error) {
                    return false
                }
            }
        }
    ]

    return (
        <>
            {llmProvidersSettings.map((settings) => {
                return (
                    <LlmProvidersSettingsApiKeyInput
                        key={settings.name}
                        name={settings.name}
                        apiKeyStorageKey={settings.apiKeyStorageKey}
                        apiKeyValidatorFunc={settings.apiKeyValidatorFunc}
                    />
                )
            })}
        </>
    )
}
