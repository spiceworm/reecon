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
    id: number
    identifier: string
    reason: string
    source: string
    username: string
}

export interface PendingRedditor {
    username: string
}

export interface PendingThread {
    path: string
    url: string
}

interface ProducedFloat {
    id: number
    value: number
}

interface ProducedInteger {
    id: number
    value: number
}

interface ProducedText {
    id: number
    value: string
}

interface ProducedTextList {
    id: number
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
    id: number
    prompt: string
    response: ProducedText
    submitter: User
    total_inputs: number
}

export interface ThreadContextQuery {
    created: Date
    context: Thread
    id: number
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
    id: number
    identifier: string
    last_processed: Date
    source: string
    submitter: User
    username: string
}

interface RedditorData {
    age: ProducedInteger
    created: Date
    id: number
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
    id: number
    message: string
    name: string
    source: string
}

export interface Thread {
    created: Date
    data: ThreadData
    id: number
    identifier: string
    last_processed: Date
    path: string
    source: string
    submitter: User
    url: string
}

interface ThreadData {
    created: Date
    id: number
    keywords: ProducedTextList
    sentiment_polarity: ProducedFloat
    sentiment_subjectivity: ProducedFloat
    summary: ProducedText
    total_inputs: number
}

export interface UnprocessableRedditor {
    created: Date
    id: number
    identifier: string
    reason: string
    source: string
    submitter: User
    username: string
}

export interface UnprocessableRedditorContextQuery {
    created: Date
    id: number
    reason: string
    submitter: User
    username: string
}

export interface UnprocessableThread {
    created: Date
    id: number
    identifier: string
    path: string
    reason: string
    source: string
    submitter: User
    url: string
}

export interface UnprocessableThreadContextQuery {
    created: Date
    id: number
    path: string
    reason: string
    submitter: User
    url: string
}

interface User {
    date_joined: Date
    id: number
    is_active: boolean
    is_staff: boolean
    is_superuser: boolean
    last_login: Date | null
    username: string
}
