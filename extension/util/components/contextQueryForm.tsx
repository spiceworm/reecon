import { useState } from "react"
import { Button, Form, Input, Label, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap"
import useSWR from "swr"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as api from "~util/api"
import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const ContextQueryForm = () => {
    const [producerSettings] = useStorage({ instance: storage.localStorage, key: constants.PRODUCER_SETTINGS }, (v: types.ProducerSettings) =>
        v === undefined ? {} : v
    )
    const [jobId, setJobId] = useStorage({ instance: storage.localStorage, key: "jobId" }, (v: string) => (v === undefined ? "" : v))
    const [queryContext, setQueryContext] = useState("")
    const [prompt, setPrompt] = useState("")
    const [shouldPostQuery, setShouldPostQuery] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [modal, setModal] = useState(false)
    const [queryResponse, setQueryResponse] = useState("")

    const { error: postError } = useSWR(
        shouldPostQuery && prompt.length > 0 ? ["/api/v1/reddit/redditor/context-query/"] : null,
        ([urlPath]) =>
            api.authPost(urlPath, {
                username: queryContext,
                prompt: prompt,
                producer_settings: producerSettings
            }),
        {
            onSuccess: async (data, key, config) => {
                setShouldPostQuery(false)
                await setJobId(data.job_id)
            }
        }
    )

    const { error: getError } = useSWR(
        jobId.length > 0 ? [`/api/v1/reddit/redditor/context-query/${jobId}`] : null,
        ([urlPath]) => api.authGet(urlPath),
        {
            refreshInterval: (latestData) => {
                console.log(latestData)

                if (latestData && "response" in latestData) {
                    setJobId("").then()
                    setIsLoading(false)
                    setQueryResponse(latestData.response.value)
                    return 0
                } else {
                    return 1000
                }
            }
        }
    )

    const onSubmitHandler = (e) => {
        e.preventDefault()
        setIsLoading(true)
        setShouldPostQuery(true)
    }

    const toggleModal = () => setModal(!modal)

    return (
        <>
            <Form onSubmit={onSubmitHandler}>
                <div className={"pt-2"}>
                    <Label for={"contextQueryContext"}>Context</Label>
                    <Input
                        id={"contextQueryContext"}
                        onChange={(e) => setQueryContext(e.target.value)}
                        type={"text"}
                        value={queryContext}
                    />
                    <Label for={"contextQueryPrompt"}>Prompt</Label>
                    <Input onChange={(e) => setPrompt(e.target.value)} id={"contextQueryPrompt"} type={"textarea"} />
                </div>

                <div className={"d-flex justify-content-center"}>
                    <Button color={"primary"} disabled={isLoading} type={"submit"}>
                        {!isLoading ? (
                            "Submit"
                        ) : (
                            <>
                                <Spinner size={"sm"} />
                                <span> Loading</span>
                            </>
                        )}
                    </Button>
                </div>
            </Form>

            <Modal isOpen={queryResponse.length > 0} toggle={toggleModal}>
                <ModalHeader toggle={toggleModal} />
                <ModalBody>{queryResponse}</ModalBody>
            </Modal>
        </>
    )
}
