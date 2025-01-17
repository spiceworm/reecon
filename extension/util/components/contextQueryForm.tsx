import Alert from "@mui/material/Alert"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Dialog from "@mui/material/Dialog"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"
import FormGroup from "@mui/material/FormGroup"
import InputLabel from "@mui/material/InputLabel"
import MenuItem from "@mui/material/MenuItem"
import Select from "@mui/material/Select"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Grid from "@mui/material/Unstable_Grid2"
import { MuiMarkdown } from "mui-markdown"
import { useRef, useState } from "react"
import useSWR from "swr"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as api from "~util/api"
import * as backgroundMessage from "~util/backgroundMessages"
import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const ContextQueryForm = () => {
    const [redditorProcessingEnabled] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.REDDITOR_CONTEXT_QUERY_PROCESSING_ENABLED },
        (v) => (v === undefined ? false : v)
    )
    const [threadProcessingEnabled] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.THREAD_CONTEXT_QUERY_PROCESSING_ENABLED },
        (v) => (v === undefined ? false : v)
    )
    const [producerSettings] = useStorage<types.ProducerSettings>(
        {
            instance: storage.extLocalStorage,
            key: constants.PRODUCER_SETTINGS
        },
        (v) => (v === undefined ? constants.defaultProducerSettings : v)
    )
    const [jobId, setJobId] = useState("")

    const [isLoading, setIsLoading] = useState(false)
    const [queryResponse, setQueryResponse] = useState("")
    const responseModalDescriptionElementRef = useRef<HTMLElement>(null)
    const [responseModalVisible, setResponseModalVisible] = useState(false)

    const [contextQueryingDisabled, setContextQueryingDisabled] = useState(false)

    const [producerDefaults, setProducerDefaults] = useState({} as types.ProducerDefaultsResponse)

    const [llmSelection, setLlmSelection] = useState("")
    const [llmProducers, setLlmProducers] = useState<types.Producer[]>([])

    const [nlpSelection, setNlpSelection] = useState("")
    const [nlpProducers, setNlpProducers] = useState<types.Producer[]>([])

    const [contextSelection, setContextSelection] = useState("")
    const [contextInputValue, setContextInputValue] = useState("")
    const [contextInputPlaceholder, setContextInputPlaceholder] = useState("")
    const [promptInputValue, setPromptInputValue] = useState("")

    const [apiEndpoint, setApiEndpoint] = useState("")
    const [postBody, setPostBody] = useState(null)
    const [formErrors, setFormErrors] = useState([])
    const [requestErrors, setRequestErrors] = useState([])

    useSWR("/api/v1/producers/defaults", api.authGet, {
        onError: async (error, key, config) => {
            setRequestErrors(requestErrors.concat(JSON.parse(error.message).detail))
        },
        onSuccess: async (data: types.ProducerDefaultsResponse, key, config) => {
            setLlmSelection(data.llm.name)
            setNlpSelection(data.nlp.name)
            setProducerDefaults(data)
        }
    })

    useSWR(llmProducers.length === 0 ? "/api/v1/producers/llm/" : null, api.authGet, {
        onError: async (error, key, config) => {
            setRequestErrors(requestErrors.concat(JSON.parse(error.message).detail))
        },
        onSuccess: async (data: types.Producer[], key, config) => {
            setLlmProducers(data)
        }
    })

    useSWR(nlpProducers.length === 0 ? "/api/v1/producers/nlp/" : null, api.authGet, {
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
        const contextSelection = e.target.value
        setContextSelection(contextSelection)

        if (contextSelection === "Redditor") {
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
        setLlmSelection(e.target.value)
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()

        const producerApiKeyIsUsable = await backgroundMessage.openAiApiKeyIsUsable(producerSettings.openai.api_key)

        if (producerApiKeyIsUsable) {
            if (contextSelection === "Redditor") {
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

            setFormErrors([])
            setIsLoading(true)
        } else {
            setFormErrors(["The provided OpenAI api key is not usable in it's current state."])
        }
    }

    const toggleResponseModalVisibility = () => setResponseModalVisible(!responseModalVisible)

    return (
        <>
            {formErrors.map((formError: string, idx: number) => (
                <Alert color={"error"} key={idx}>
                    {formError}
                </Alert>
            ))}

            {requestErrors.map((requestError: string, idx: number) => (
                <Alert color={"error"} key={idx}>
                    {requestError}
                </Alert>
            ))}

            <Stack component={"form"} onSubmit={onSubmitHandler} spacing={2}>
                <Grid container spacing={2}>
                    <Grid xs={3} sm={3} md={3} lg={3} xl={3}>
                        <FormGroup>
                            <InputLabel id={"contextQueryLlm"}>LLM</InputLabel>
                            <Select
                                labelId={"contextQueryLlm"}
                                id={"contextQueryLlm"}
                                value={llmSelection}
                                onChange={onLlmChangeHandler}
                                required={true}
                                variant={"outlined"}>
                                {llmProducers
                                    ? llmProducers.map((llmProducer: types.Producer) => {
                                          return <MenuItem value={llmProducer.name}>{llmProducer.name}</MenuItem>
                                      })
                                    : null}
                            </Select>
                        </FormGroup>
                    </Grid>

                    <Grid xs={3} sm={3} md={3} lg={3} xl={3}>
                        <FormGroup>
                            <InputLabel id={"contextQueryContextType"}>Context Type</InputLabel>
                            <Select
                                labelId={"contextQueryContextType"}
                                value={contextSelection}
                                onChange={onContextChangeHandler}
                                required={true}
                                variant={"outlined"}>
                                <MenuItem value={"Redditor"}>{"Redditor"}</MenuItem>
                                <MenuItem value={"Thread"}>{"Thread"}</MenuItem>
                            </Select>
                        </FormGroup>
                    </Grid>

                    <Grid xs={6} sm={6} md={6} lg={6} xl={6}>
                        <FormGroup>
                            <InputLabel htmlFor={"contextQueryContextValue"}>Context Value</InputLabel>
                            <TextField
                                id={"contextQueryContextValue"}
                                disabled={isLoading || contextQueryingDisabled || !contextSelection}
                                fullWidth={true}
                                onChange={(e) => setContextInputValue(e.target.value)}
                                placeholder={contextInputPlaceholder}
                                required={true}
                                type={contextSelection === "Thread" ? "url" : "text"}
                                value={contextInputValue}
                                variant={"outlined"}
                            />
                        </FormGroup>
                    </Grid>
                </Grid>

                <Grid container spacing={2}>
                    <Grid xs={12} sm={12} md={12} lg={12} xl={12}>
                        <FormGroup>
                            <InputLabel htmlFor={"contextQueryPrompt"}>Prompt</InputLabel>
                            <TextField
                                disabled={isLoading || contextQueryingDisabled}
                                multiline={true}
                                onChange={(e) => setPromptInputValue(e.target.value)}
                                required={true}
                                value={promptInputValue}
                                variant={"outlined"}
                            />
                        </FormGroup>
                    </Grid>
                </Grid>

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
                            <CircularProgress />
                            <span> Loading</span>
                        </>
                    )}
                </Button>
            </Stack>

            <Dialog open={responseModalVisible} onClose={toggleResponseModalVisibility}>
                <DialogTitle>Response</DialogTitle>
                <DialogContent dividers={true}>
                    <DialogContentText ref={responseModalDescriptionElementRef} tabIndex={-1}>
                        <MuiMarkdown>{queryResponse}</MuiMarkdown>
                    </DialogContentText>
                </DialogContent>
            </Dialog>
        </>
    )
}
