import OpenAI from "openai"
import { useState } from "react"
import { Eye, EyeSlash } from "react-bootstrap-icons"
import { Button, FormFeedback, Input, InputGroup, InputGroupText } from "reactstrap"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as constants from "~util/constants"
import * as storage from "~util/storage"

const ProducerSettingsApiKeyInput = ({ name, apiKeyStorageKey, apiKeyValidatorFunc }) => {
    const [keyVisible, setKeyVisible] = useState(false)
    const [showKeyValidationError, setShowKeyValidationError] = useState(false)
    const [apiKey, _, { setRenderValue, setStoreValue }] = useStorage<string>({ instance: storage.extLocalStorage, key: apiKeyStorageKey }, (v) =>
        v === undefined ? "" : v
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
        <InputGroup key={name}>
            <InputGroupText>{name}</InputGroupText>

            <Input
                invalid={showKeyValidationError}
                onBlur={validateApiKey}
                onChange={(e) => setRenderValue(e.target.value)}
                placeholder={"API Key"}
                type={keyVisible ? "text" : "password"}
                value={apiKey}
            />
            {showKeyValidationError ? <FormFeedback tooltip={true}>Invalid {name} API key</FormFeedback> : null}

            <Button onClick={(e) => setKeyVisible(!keyVisible)}>{keyVisible ? <Eye /> : <EyeSlash />}</Button>
        </InputGroup>
    )
}

export const ProducerSettingsInputs = () => {
    const producerSettings = [
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
            {producerSettings.map((producerSetting) => {
                return (
                    <ProducerSettingsApiKeyInput
                        key={producerSetting.name}
                        name={producerSetting.name}
                        apiKeyStorageKey={producerSetting.apiKeyStorageKey}
                        apiKeyValidatorFunc={producerSetting.apiKeyValidatorFunc}
                    />
                )
            })}
        </>
    )
}
