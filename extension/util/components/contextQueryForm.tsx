import LoadingButton from "@mui/lab/LoadingButton"
import Alert from "@mui/material/Alert"
import Dialog from "@mui/material/Dialog"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"
import FormGroup from "@mui/material/FormGroup"
import InputLabel from "@mui/material/InputLabel"
import MenuItem from "@mui/material/MenuItem"
import Select from "@mui/material/Select"
import Snackbar from "@mui/material/Snackbar"
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
import type { LLM } from "~util/types/backend/reecon/modelSerializers"
import type {
    LlmDefaultsResponse,
    LlmProvidersSettings,
    RedditorContextQueryCreateRequest,
    RedditorContextQueryCreateResponse,
    RedditorContextQueryRetrieveResponse,
    ThreadContextQueryCreateRequest,
    ThreadContextQueryCreateResponse,
    ThreadContextQueryRetrieveResponse
} from "~util/types/backend/server/apiSerializers"

export const ContextQueryForm = () => {
    const [redditorProcessingEnabled] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.REDDITOR_CONTEXT_QUERY_PROCESSING_ENABLED },
        (v) => (v === undefined ? false : v)
    )
    const [threadProcessingEnabled] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.THREAD_CONTEXT_QUERY_PROCESSING_ENABLED },
        (v) => (v === undefined ? false : v)
    )
    const [llmProvidersSettings] = useStorage<LlmProvidersSettings>(
        {
            instance: storage.extLocalStorage,
            key: constants.LLM_PROVIDERS_SETTINGS
        },
        (v) => (v === undefined ? constants.defaultLlmProvidersSettings : v)
    )
    const [jobId, setJobId] = useState("")

    const [isLoading, setIsLoading] = useState(false)
    const [queryResponse, setQueryResponse] = useState("")
    const responseModalDescriptionElementRef = useRef<HTMLElement>(null)
    const [responseModalVisible, setResponseModalVisible] = useState(false)

    const [contextQueryingDisabled, setContextQueryingDisabled] = useState(false)

    const [llmDefaults, setLlmDefaults] = useState({} as LlmDefaultsResponse)

    const [llmSelection, setLlmSelection] = useState("")
    const [llms, setLlms] = useState<LLM[]>([])

    const [contextSelection, setContextSelection] = useState("")
    const [contextInputValue, setContextInputValue] = useState("")
    const [contextInputPlaceholder, setContextInputPlaceholder] = useState("")
    const [promptInputValue, setPromptInputValue] = useState("")

    const [snackBarMessage, setSnackBarMessage] = useState("")
    const [snackBarVisible, setSnackBarVisible] = useState(false)

    const [apiEndpoint, setApiEndpoint] = useState("")
    const [postBody, setPostBody] = useState<RedditorContextQueryCreateRequest | ThreadContextQueryCreateRequest>(null)
    const [formErrors, setFormErrors] = useState([])
    const [requestErrors, setRequestErrors] = useState([])

    useSWR("/api/v1/llm/defaults", api.authGet, {
        onError: async (error, key, config) => {
            setRequestErrors(requestErrors.concat(JSON.parse(error.message).detail))
        },
        onSuccess: async (data: LlmDefaultsResponse, key, config) => {
            setLlmDefaults(data)
        }
    })

    useSWR(llms.length === 0 ? "/api/v1/llm/" : null, api.authGet, {
        onError: async (error, key, config) => {
            setRequestErrors(requestErrors.concat(JSON.parse(error.message).detail))
        },
        onSuccess: async (data: LLM[], key, config) => {
            setLlms(data)
        }
    })

    useSWR(postBody !== null ? [apiEndpoint] : null, ([urlPath]) => api.authPost(urlPath, postBody), {
        onError: async (error, key, config) => {
            setRequestErrors(requestErrors.concat(JSON.parse(error.message).detail))
            setIsLoading(false)
        },
        onSuccess: async (data: RedditorContextQueryCreateResponse | ThreadContextQueryCreateResponse, key, config) => {
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
        refreshInterval: (latestData: RedditorContextQueryRetrieveResponse | ThreadContextQueryRetrieveResponse) => {
            if (latestData && "success" in latestData && latestData.success !== null) {
                setJobId("")
                setIsLoading(false)
                setQueryResponse(latestData.success.response)
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
            setPromptInputValue(llmDefaults.prompts.process_redditor_context_query)
            setContextQueryingDisabled(!redditorProcessingEnabled)
            setContextInputPlaceholder("Redditor Username")

            if (contextQueryingDisabled) {
                setSnackBarMessage("Redditor context querying is currently disabled")
                setSnackBarVisible(true)
            }
        } else {
            setPromptInputValue(llmDefaults.prompts.process_thread_context_query)
            setContextQueryingDisabled(!threadProcessingEnabled)
            setContextInputPlaceholder("Thread URL")

            if (contextQueryingDisabled) {
                setSnackBarMessage("Thread context querying is currently disabled")
                setSnackBarVisible(true)
            }
        }
    }

    const onLlmChangeHandler = async (e) => {
        setLlmSelection(e.target.value)
    }

    const onClickHandler = async () => {
        const apiKeyIsUsable = await backgroundMessage.openAiApiKeyIsUsable(llmProvidersSettings.openai.api_key)

        if (apiKeyIsUsable) {
            if (contextSelection === "Redditor") {
                setApiEndpoint("/api/v1/reddit/redditor/context-query/")
                setPostBody({
                    llm_name: llmSelection,
                    llm_providers_settings: llmProvidersSettings,
                    prompt: promptInputValue,
                    username: contextInputValue
                })
            } else {
                setApiEndpoint("/api/v1/reddit/thread/context-query/")
                setPostBody({
                    llm_name: llmSelection,
                    path: new URL(contextInputValue).pathname,
                    llm_providers_settings: llmProvidersSettings,
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

            <Stack spacing={2}>
                <Grid container spacing={2}>
                    <Grid xs={3} sm={3} md={3} lg={3} xl={3}>
                        <FormGroup>
                            <InputLabel id={"contextQueryLlm"}>LLM</InputLabel>
                            <Select
                                disabled={isLoading}
                                labelId={"contextQueryLlm"}
                                id={"contextQueryLlm"}
                                value={llmSelection}
                                onChange={onLlmChangeHandler}
                                required={true}
                                variant={"outlined"}>
                                {llms ? llms.map((llm: LLM) => <MenuItem value={llm.name}>{llm.name}</MenuItem>) : null}
                            </Select>
                        </FormGroup>
                    </Grid>

                    <Grid xs={3} sm={3} md={3} lg={3} xl={3}>
                        <FormGroup>
                            <InputLabel id={"contextQueryContextType"}>Context Type</InputLabel>
                            <Select
                                disabled={isLoading}
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

                <LoadingButton color={"primary"} disabled={isLoading || contextQueryingDisabled} loading={isLoading} onClick={onClickHandler}>
                    <span>submit query</span>
                </LoadingButton>
            </Stack>

            <Dialog open={responseModalVisible} onClose={toggleResponseModalVisibility}>
                <DialogTitle>Response</DialogTitle>
                <DialogContent dividers={true}>
                    <DialogContentText ref={responseModalDescriptionElementRef} tabIndex={-1}>
                        <MuiMarkdown>{queryResponse}</MuiMarkdown>
                    </DialogContentText>
                </DialogContent>
            </Dialog>

            <Snackbar open={snackBarVisible} autoHideDuration={6000} onClose={() => setSnackBarVisible(false)} message={snackBarMessage} />
        </>
    )
}
