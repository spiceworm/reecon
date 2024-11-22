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

export interface Redditor {
    created: Date
    data: RedditorData
    last_processed: Date
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
}

export interface UnprocessableThread {
    created: Date
    path: string
    reason: string
    url: string
}
