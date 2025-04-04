import type {
    ApiStatusMessage,
    IgnoredRedditor,
    ProcessedRedditor,
    ProcessedThread,
    RedditorContextQuery,
    ThreadContextQuery,
    UnprocessableRedditor,
    UnprocessableRedditorContextQuery,
    UnprocessableThread,
    UnprocessableThreadContextQuery,
    User
} from "~util/types/backend/reecon/modelSerializers"

export interface AuthTokenRefreshResponse {
    access: string
}

interface ContextQueryCreateResponse {
    job_id: string
}

export interface LlmDefaultsResponse {
    prompts: {
        process_redditor_context_query: string
        process_thread_context_query: string
        process_redditor_data: string
        process_thread_data: string
    }
}

interface LlmProviderSettings {
    api_key: string
}

export interface LlmProvidersSettings {
    openai: LlmProviderSettings
}

export interface LoginRequest {
    password: string
    username: string
}

export interface LoginResponse {
    access: string
    refresh: string
}

export interface PendingRedditor {
    username: string
}

export interface PendingThread {
    path: string
}

export type StatusMessageResponse = ApiStatusMessage[]

export interface RedditorContextQueryCreateRequest {
    llm_name: string
    llm_providers_settings: LlmProvidersSettings
    prompt: string
    username: string
}

export interface RedditorDataRequest {
    llm_providers_settings: LlmProvidersSettings
    usernames: string[]
}

export interface RedditorDataResponse {
    ignored: IgnoredRedditor[]
    pending: PendingRedditor[]
    processed: ProcessedRedditor[]
    unprocessable: UnprocessableRedditor[]
}

export type RedditorContextQueryCreateResponse = ContextQueryCreateResponse

export interface RedditorContextQueryRetrieveResponse {
    error: UnprocessableRedditorContextQuery | null
    success: RedditorContextQuery | null
}

export type SignupRequest = LoginRequest

export type SignupResponse = User

export interface ThreadContextQueryCreateRequest {
    llm_name: string
    llm_providers_settings: LlmProvidersSettings
    path: string
    prompt: string
}

export type ThreadContextQueryCreateResponse = ContextQueryCreateResponse

export interface ThreadContextQueryRetrieveResponse {
    error: UnprocessableThreadContextQuery | null
    success: ThreadContextQuery | null
}

export interface ThreadDataRequest {
    llm_providers_settings: LlmProvidersSettings
    paths: string[]
}

export interface ThreadDataResponse {
    pending: PendingThread[]
    processed: ProcessedThread[]
    unprocessable: UnprocessableThread[]
}
