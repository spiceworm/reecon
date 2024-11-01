import 'bootstrap/dist/css/bootstrap.min.css'
import {useStorage} from "@plasmohq/storage/dist/hook"
import {useState} from "react"
import {Button, Input, InputGroup, InputGroupText} from "reactstrap"
import {Eye, EyeSlash} from 'react-bootstrap-icons'

import * as storage from "~util/storage"


const ProducerSettingsApiKeyInput = ({name, apiKeyStorageKey}) => {
    const [keyVisible, setKeyVisible] = useState(false)
    const [apiKey, setApiKey] = useStorage({instance: storage.instance, key: apiKeyStorageKey}, (v: string) => v === undefined ? "" : v)

    return (
            <InputGroup key={name}>
                <InputGroupText>
                    {name}
                </InputGroupText>

                <Input
                    id={name}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={'API Key'}
                    type={keyVisible ? "text" : "password"}
                    value={apiKey}
                />

                <Button onClick={(e) => {setKeyVisible(!keyVisible)}}>
                    {
                        keyVisible ? <Eye/> : <EyeSlash/>
                    }
                </Button>
            </InputGroup>
    )
}


export const ProducerSettingsInputs = () => {
    const producerSettings = [
        {
            name: "OpenAI",
            apiKeyStorageKey: storage.OPENAI_API_KEY,
        },
    ]

    return (
        <>
            {producerSettings.map(producerSetting => {
                return (
                    <ProducerSettingsApiKeyInput
                        key={producerSetting.name}
                        name={producerSetting.name}
                        apiKeyStorageKey={producerSetting.apiKeyStorageKey}
                    />
                )
            })}
        </>
    )
}
