interface ContextQuery {
    created: Date
    id: number
    prompt: string
    response: ProducedText
    submitter: User
    total_inputs: number
}

interface ProducedData {
    contributor: User
    id: number
    producer: Producer
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

interface ProducerCategory {
    created: Date
    description: string
    id: number
    name: string
}

interface RedditData {
    created: Date
    id: number
    sentiment_polarity: ProducedFloat
    sentiment_subjectivity: ProducedFloat
    summary: ProducedText
    total_inputs: number
}

interface RedditEntity {
    created: Date
    id: number
    identifier: string
    last_processed: Date
    source: string
    submitter: User
}

interface RedditorData extends RedditData {
    age: ProducedInteger
    iq: ProducedInteger
    interests: ProducedTextList
}

interface StatusMessage {
    active: boolean
    category: string
    message: string
    name: string
    source: string
}

interface ThreadData extends RedditData {
    keywords: ProducedTextList
}

interface UnprocessableRedditContextQuery {
    created: Date
    id: number
    reason: string
    submitter: User
}

interface UnprocessableRedditEntity {
    created: Date
    id: number
    identifier: string
    reason: string
    source: string
    submitter: User
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

export interface ApiStatusMessage extends StatusMessage {
    id: number
}

export interface Auth {
    access: string
    refresh: string
}

export interface AuthTokenRefreshResponse {
    access: string
}

export interface ContentFilter {
    context: string
    filterType: string
}

export interface CommentFilter extends ContentFilter {
    age: number
    iq: number
    sentimentPolarity: number
    sentimentSubjectivity: number
}

export interface ThreadFilter extends ContentFilter {
    sentimentPolarity: number
    sentimentSubjectivity: number
}

export interface CachedRecord {
    expires: string
    value: any
}

export interface CachedIgnoredRedditor extends CachedRecord {
    value: IgnoredRedditor
}

export interface CachedPendingRedditor extends CachedRecord {
    value: PendingRedditor
}

export interface CachedProcessedRedditor extends CachedRecord {
    value: Redditor
}

export interface CachedUnprocessableRedditor extends CachedRecord {
    value: UnprocessableRedditor
}

export interface CachedPendingThread extends CachedRecord {
    value: PendingThread
}

export interface CachedProcessedThread extends CachedRecord {
    value: Thread
}

export interface CachedUnprocessableThread extends CachedRecord {
    value: UnprocessableThread
}

export interface ExtensionStatusMessage extends StatusMessage {}

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

export interface Producer {
    category: ProducerCategory
    context_window: number | null
    created: Date
    description: string
    id: number
    name: string
}

export interface ProducerDefaultsResponse {
    llm: Producer
    nlp: Producer
    prompts: {
        process_redditor_context_query: string
        process_thread_context_query: string
        process_redditor_data: string
        process_thread_data: string
    }
}

export interface ProducerSettings {
    openai: {
        api_key: string
    }
}

export interface Redditor extends RedditEntity {
    data: RedditorData
    username: string
}

export interface RedditorContextQuery extends ContextQuery {
    context: Redditor
}

export interface RedditorContextQueryResponse {
    error: UnprocessableRedditorContextQuery | null
    success: RedditorContextQuery | null
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

export interface Thread extends RedditEntity {
    data: ThreadData
    path: string
    url: string
}

export interface ThreadContextQuery extends ContextQuery {
    context: Thread
}

export interface ThreadContextQueryResponse {
    error: UnprocessableThreadContextQuery | null
    success: ThreadContextQuery | null
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
