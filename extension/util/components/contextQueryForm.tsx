import { useState } from "react"
import {
    Button,
    Col,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Form,
    FormGroup,
    Input,
    InputGroup,
    Label,
    Modal,
    ModalBody,
    ModalHeader,
    Spinner,
    UncontrolledAlert,
    UncontrolledDropdown
} from "reactstrap"
import useSWR from "swr"
import useSWRImmutable from "swr/immutable"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as api from "~util/api"
import * as markdown from "~util/components/markdown"
import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const ContextQueryForm = () => {
    const [redditorProcessingEnabled] = useStorage(
        { instance: storage.localStorage, key: constants.REDDITOR_CONTEXT_QUERY_PROCESSING_ENABLED },
        (v: boolean) => (v === undefined ? false : v)
    )
    const [threadProcessingEnabled] = useStorage(
        { instance: storage.localStorage, key: constants.THREAD_CONTEXT_QUERY_PROCESSING_ENABLED },
        (v: boolean) => (v === undefined ? false : v)
    )
    const [producerSettings] = useStorage(
        {
            instance: storage.localStorage,
            key: constants.PRODUCER_SETTINGS
        },
        (v: types.ProducerSettings) => (v === undefined ? constants.defaultProducerSettings : v)
    )
    const [jobId, setJobId] = useState("")

    const [isLoading, setIsLoading] = useState(false)
    const [queryResponse, setQueryResponse] = useState("")
    const [responseModalVisible, setResponseModalVisible] = useState(false)

    const [contextQueryingDisabled, setContextQueryingDisabled] = useState(false)

    const [producerDefaults, setProducerDefaults] = useState({} as types.ProducerDefaultsResponse)

    const [llmSelection, setLlmSelection] = useState("")
    const [llmProducers, setLlmProducers] = useState([] as types.Producer[])

    const [nlpSelection, setNlpSelection] = useState("")
    const [nlpProducers, setNlpProducers] = useState([] as types.Producer[])

    const [contextSelection, setContextSelection] = useState("Choose")
    const [contextInputValue, setContextInputValue] = useState("")
    const [contextInputPlaceholder, setContextInputPlaceholder] = useState("")
    const [promptInputValue, setPromptInputValue] = useState("")

    const [apiEndpoint, setApiEndpoint] = useState("")
    const [postBody, setPostBody] = useState(null)
    const [requestErrors, setRequestErrors] = useState([])

    useSWRImmutable("/api/v1/producers/defaults", api.authGet, {
        onError: async (error, key, config) => {
            setRequestErrors(requestErrors.concat(JSON.parse(error.message).detail))
        },
        onSuccess: async (data: types.ProducerDefaultsResponse, key, config) => {
            setLlmSelection(data.llm.name)
            setNlpSelection(data.nlp.name)
            setProducerDefaults(data)
        }
    })

    useSWRImmutable("/api/v1/producers/llm/", api.authGet, {
        onError: async (error, key, config) => {
            setRequestErrors(requestErrors.concat(JSON.parse(error.message).detail))
        },
        onSuccess: async (data: types.Producer[], key, config) => {
            setLlmProducers(data)
        }
    })

    useSWRImmutable("/api/v1/producers/nlp/", api.authGet, {
        onError: async (error, key, config) => {
            setRequestErrors(requestErrors.concat(JSON.parse(error.message).detail))
        },
        onSuccess: async (data: types.Producer[], key, config) => {
            setNlpProducers(data)
        }
    })

    useSWR(postBody !== null ? [apiEndpoint] : null, ([urlPath]) => api.authPost(urlPath, postBody), {
        onError: async (error, key, config) => {
            setRequestErrors(requestErrors.concat(JSON.parse(error.message).detail))
            setIsLoading(false)
        },
        onSuccess: async (data: types.SubmitContextQueryResponse, key, config) => {
            setPostBody(null)
            setJobId(data.job_id)

            // If context queries are disabled
            if (data.job_id.length === 0) {
                setIsLoading(false)
            }
        }
    })

    useSWR(jobId.length > 0 ? [`${apiEndpoint}${jobId}`] : null, ([urlPath]) => api.authGet(urlPath), {
        onError: async (error, key, config) => {
            setRequestErrors(requestErrors.concat(JSON.parse(error.message).detail))
            setIsLoading(false)
        },
        refreshInterval: (latestData: types.RedditorContextQueryResponse | types.ThreadContextQueryResponse) => {
            if (latestData && "success" in latestData && latestData.success !== null) {
                setJobId("")
                setIsLoading(false)
                setQueryResponse(latestData.success.response.value)
                setResponseModalVisible(true)
                return 0
            }
            if (latestData && "error" in latestData && latestData.error !== null) {
                setJobId("")
                setIsLoading(false)
                setRequestErrors(requestErrors.concat(latestData.error.reason))
                return 0
            }
            return 1000
        }
    })

    const onContextChangeHandler = async (e) => {
        const contextSelection = e.target.innerText
        setContextSelection(contextSelection)

        if (contextSelection === "redditor") {
            setPromptInputValue(producerDefaults.prompts.process_redditor_context_query)

            if (redditorProcessingEnabled) {
                setContextQueryingDisabled(false)
                setContextInputPlaceholder("Redditor Username")
            } else {
                setContextQueryingDisabled(true)
                // TODO: the below message should appear in a toast and not in the input field
                setContextInputPlaceholder("Redditor context query processing is disabled")
            }
        } else {
            setPromptInputValue(producerDefaults.prompts.process_thread_context_query)

            if (threadProcessingEnabled) {
                setContextQueryingDisabled(false)
                setContextInputPlaceholder("Thread URL")
            } else {
                setContextQueryingDisabled(true)
                // TODO: the below message should appear in a toast and not in the input field
                setContextInputPlaceholder("Thread context query processing is disabled")
            }
        }
    }

    const onLlmChangeHandler = async (e) => {
        setLlmSelection(e.target.innerText)
    }

    const onNlpChangeHandler = async (e) => {
        setNlpSelection(e.target.innerText)
    }

    const onSubmitHandler = (e) => {
        e.preventDefault()

        if (contextSelection === "redditor") {
            setApiEndpoint("/api/v1/reddit/redditor/context-query/")
            setPostBody({
                llm_name: llmSelection,
                nlp_name: nlpSelection,
                producer_settings: producerSettings,
                prompt: promptInputValue,
                username: contextInputValue
            })
        } else {
            setApiEndpoint("/api/v1/reddit/thread/context-query/")
            setPostBody({
                llm_name: llmSelection,
                nlp_name: nlpSelection,
                path: new URL(contextInputValue).pathname,
                producer_settings: producerSettings,
                prompt: promptInputValue
            })
        }

        setIsLoading(true)
    }

    const toggleResponseModalVisibility = () => setResponseModalVisible(!responseModalVisible)

    return (
        <>
            {requestErrors.map((requestError: string, idx: number) => (
                <UncontrolledAlert color={"danger"} key={idx}>
                    {requestError}
                </UncontrolledAlert>
            ))}

            <Form onSubmit={onSubmitHandler}>
                <div className={"pt-2"}>
                    <FormGroup row>
                        <Label for={"contextQueryLlm"} lg={1}>
                            LLM
                        </Label>
                        <Col lg={11}>
                            <InputGroup id={"contextQueryLlm"}>
                                <UncontrolledDropdown>
                                    <DropdownToggle caret>{llmSelection} </DropdownToggle>
                                    <DropdownMenu>
                                        {llmProducers
                                            ? llmProducers.map((llmProducer: types.Producer, idx: number) => {
                                                  return (
                                                      <DropdownItem key={idx} onClick={onLlmChangeHandler}>
                                                          {llmProducer.name}
                                                      </DropdownItem>
                                                  )
                                              })
                                            : null}
                                    </DropdownMenu>
                                </UncontrolledDropdown>
                            </InputGroup>
                        </Col>
                    </FormGroup>

                    <FormGroup row>
                        <Label for={"contextQueryNlp"} lg={1}>
                            NLP
                        </Label>
                        <Col lg={11}>
                            <InputGroup id={"contextQueryNlp"}>
                                <UncontrolledDropdown>
                                    <DropdownToggle caret>{nlpSelection} </DropdownToggle>
                                    <DropdownMenu>
                                        {nlpProducers
                                            ? nlpProducers.map((nlpProducer: types.Producer, idx: number) => {
                                                  return (
                                                      <DropdownItem key={idx} onClick={onNlpChangeHandler}>
                                                          {nlpProducer.name}
                                                      </DropdownItem>
                                                  )
                                              })
                                            : null}
                                    </DropdownMenu>
                                </UncontrolledDropdown>
                            </InputGroup>
                        </Col>
                    </FormGroup>

                    <FormGroup row>
                        <Label for={"contextQueryContext"} lg={1}>
                            Context
                        </Label>
                        <Col lg={11}>
                            <InputGroup>
                                <UncontrolledDropdown>
                                    <DropdownToggle caret>{contextSelection} </DropdownToggle>
                                    <DropdownMenu>
                                        <DropdownItem onClick={onContextChangeHandler}>redditor</DropdownItem>
                                        <DropdownItem onClick={onContextChangeHandler}>thread</DropdownItem>
                                    </DropdownMenu>
                                </UncontrolledDropdown>
                                <Input
                                    id={"contextQueryContext"}
                                    disabled={contextQueryingDisabled}
                                    onChange={(e) => setContextInputValue(e.target.value)}
                                    placeholder={contextInputPlaceholder}
                                    required={true}
                                    type={contextSelection === "thread" ? "url" : "text"}
                                    value={contextInputValue}
                                />
                            </InputGroup>
                        </Col>
                    </FormGroup>

                    <FormGroup row>
                        <Label for={"contextQueryPrompt"} lg={1}>
                            Prompt
                        </Label>
                        <Col lg={11}>
                            <Input
                                disabled={contextQueryingDisabled}
                                id={"contextQueryPrompt"}
                                onChange={(e) => setPromptInputValue(e.target.value)}
                                required={true}
                                type={"textarea"}
                                value={promptInputValue}
                            />
                        </Col>
                    </FormGroup>
                </div>

                <div className={"d-flex justify-content-center"}>
                    <Button color={"primary"} disabled={isLoading || contextQueryingDisabled} type={"submit"}>
                        {!isLoading ? (
                            "Submit"
                        ) : (
                            <>
                                {/*
                                TODO: show the spinner on a modal where we can display text about how the
                                request will appear in their query history if it is taking too long and they
                                do not want to sit and wait for a response. Showing it on a modal also prevents
                                them from modifying the form and sending additional queries.
                                */}
                                <Spinner size={"sm"} />
                                <span> Loading</span>
                            </>
                        )}
                    </Button>
                </div>
            </Form>

            <Modal isOpen={responseModalVisible} toggle={toggleResponseModalVisibility}>
                <ModalHeader toggle={toggleResponseModalVisibility} />
                <ModalBody>
                    <markdown.Markdown>{queryResponse}</markdown.Markdown>
                </ModalBody>
            </Modal>
        </>
    )
}
