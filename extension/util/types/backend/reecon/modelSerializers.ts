export type ApiStatusMessage = StatusMessage

interface ContextQuery {
    created: Date
    prompt: string
    response: string
    request_meta: RequestMetadata
}

export interface IgnoredRedditor {
    identifier: string
    reason: string
    source: string
    username: string
}

export interface LLM {
    context_window: number | null
    description: string
    name: string
    provider: LlmProvider
}

interface LlmProvider {
    display_name: string
    name: string
}

export interface Profile {
    reddit_username: string | null
    signed_username: string
    user: User
}

export interface ProcessedRedditor extends RedditEntity {
    data: ProcessedRedditorData
    username: string
}

export interface ProcessedThread extends RedditEntity {
    data: ProcessedThreadData
    path: string
    url: string
}

interface ProcessedThreadData extends ProcessedRedditEntityData {
    keywords: string[]
}

interface ProcessedRedditEntityData {
    created: Date
    request_meta: RequestMetadata
    sentiment_polarity: number
    sentiment_subjectivity: number
    summary: string
}

interface ProcessedRedditorData extends ProcessedRedditEntityData {
    age: number
    iq: number
    interests: string[]
}

interface RedditEntity {
    created: Date
    identifier: string
    last_processed: Date
    source: string
}

export interface RedditorContextQuery extends ContextQuery {
    context: ProcessedRedditor
}

interface RequestMetadata {
    contributor: UserUsername
    input_tokens: number
    llm: LLM
    output_tokens: number
    submitter: UserUsername
    total_inputs: number
    total_tokens: number
}

export interface StatusMessage {
    active: boolean
    category: "success" | "info" | "warning" | "error"
    message: string
    name: string
    source: "api" | "extension"
}

export interface ThreadContextQuery extends ContextQuery {
    context: ProcessedThread
}

interface UnprocessableRedditContextQuery {
    created: Date
    reason: string
}

interface UnprocessableRedditEntity {
    created: Date
    identifier: string
    reason: string
    source: string
}

export interface UnprocessableRedditor extends UnprocessableRedditEntity {
    username: string
}

export interface UnprocessableRedditorContextQuery extends UnprocessableRedditContextQuery {
    username: string
}

export interface UnprocessableThread extends UnprocessableRedditEntity {
    path: string
    url: string
}

export interface UnprocessableThreadContextQuery extends UnprocessableRedditContextQuery {
    path: string
    url: string
}

export interface User {
    date_joined: Date
    is_active: boolean
    is_staff: boolean
    is_superuser: boolean
    last_login: Date | null
    username: string
}

type UserUsername = Pick<User, "username">
