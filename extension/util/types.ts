export interface Auth {
    access: string
    refresh: string
}

export interface AuthTokenRefreshResponse {
    access: string
}

export interface ContentFilter {
    age: number
    context: string
    filterType: string
    iq: number
    sentiment: number
}

export interface IgnoredRedditor {
    username: string
    reason: string
}

export interface PendingRedditor {
    username: string
}

export interface PendingThread {
    path: string
    url: string
}

interface ProducedFloat {
    value: number
}

interface ProducedInteger {
    value: number
}

interface ProducedText {
    value: string
}

interface ProducedTextList {
    value: string[]
}

export interface ProducerSettings {
    openai: {
        api_key: string
    }
}

export interface SubmitContextQueryResponse {
    job_id: string
}

export interface SubmitRedditorDataResponse {
    ignored: IgnoredRedditor[]
    pending: PendingRedditor[]
    processed: Redditor[]
    unprocessable: UnprocessableRedditor[]
}

export interface SubmitThreadDataResponse {
    pending: PendingThread[]
    processed: Thread[]
    unprocessable: UnprocessableThread[]
}

export interface RedditorContextQuery {
    created: Date
    context: Redditor
    prompt: string
    response: ProducedText
    submitter: User
    total_inputs: number
}

export interface ThreadContextQuery {
    created: Date
    context: Thread
    prompt: string
    response: ProducedText
    submitter: User
    total_inputs: number
}

export interface ContextQueryResponse {
    error: UnprocessableRedditorContextQuery | UnprocessableThreadContextQuery | null
    success: RedditorContextQuery | ThreadContextQuery | null
}

export interface Redditor {
    created: Date
    data: RedditorData
    last_processed: Date
    submitter: User
    username: string
}

interface RedditorData {
    age: ProducedInteger
    created: Date
    iq: ProducedInteger
    interests: ProducedTextList
    sentiment_polarity: ProducedFloat
    sentiment_subjectivity: ProducedFloat
    summary: ProducedText
    total_inputs: number
}

export interface StatusMessage {
    active: boolean
    category: string
    message: string
    name: string
    source: string
}

export interface Thread {
    created: Date
    data: ThreadData
    last_processed: Date
    path: string
    submitter: User
    url: string
}

interface ThreadData {
    created: Date
    keywords: ProducedTextList
    sentiment_polarity: ProducedFloat
    sentiment_subjectivity: ProducedFloat
    summary: ProducedText
    total_inputs: number
}

export interface UnprocessableRedditor {
    created: Date
    username: string
    reason: string
    submitter: User
}

export interface UnprocessableRedditorContextQuery {
    created: Date
    username: string
    reason: string
    submitter: User
}

export interface UnprocessableThread {
    created: Date
    path: string
    reason: string
    submitter: User
    url: string
}

export interface UnprocessableThreadContextQuery {
    created: Date
    path: string
    reason: string
    submitter: User
    url: string
}

interface User {
    date_joined: Date
    is_active: boolean
    is_staff: boolean
    is_superuser: boolean
    last_login: Date | null
    username: string
}
