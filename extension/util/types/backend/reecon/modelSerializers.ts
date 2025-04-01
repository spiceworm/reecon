export type ApiStatusMessage = StatusMessage

interface ContextQuery {
    created: Date
    prompt: string
    response: ProducedText
    submitter: UserUsername
    total_inputs: number
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

interface ProducedData {
    contributor: UserUsername
    llm: LLM
}

interface ProducedFloat extends ProducedData {
    value: number
}

interface ProducedInteger extends ProducedData {
    value: number
}

interface ProducedText extends ProducedData {
    value: string
}

interface ProducedTextList extends ProducedData {
    value: string[]
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
    keywords: ProducedTextList
}

interface ProcessedRedditEntityData {
    created: Date
    sentiment_polarity: ProducedFloat
    sentiment_subjectivity: ProducedFloat
    summary: ProducedText
    total_inputs: number
}

interface ProcessedRedditorData extends ProcessedRedditEntityData {
    age: ProducedInteger
    iq: ProducedInteger
    interests: ProducedTextList
}

interface RedditEntity {
    created: Date
    identifier: string
    last_processed: Date
    source: string
    submitter: UserUsername
}

export interface RedditorContextQuery extends ContextQuery {
    context: ProcessedRedditor
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
    submitter: UserUsername
}

interface UnprocessableRedditEntity {
    created: Date
    identifier: string
    reason: string
    source: string
    submitter: UserUsername
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
