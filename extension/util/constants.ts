import type * as types from "~util/types"

export const AUTH = "_auth"
export const DISABLE_EXTENSION = "_disableExtension"

export const ACTIVE_COMMENT_FILTER = "_activeCommentFilter"
export const ACTIVE_THREAD_FILTER = "_activeThreadFilter"
export const ALL_COMMENT_FILTERS = "_allCommentFilters"
export const ALL_THREAD_FILTERS = "_allThreadFilters"
export const DEFAULT_COMMENT_FILTER = "_defaultCommentFilter"
export const DEFAULT_THREAD_FILTER = "_defaultThreadFilter"

export const ALL_STATUS_MESSAGES = "_allStatusMessages"
export const API_STATUS_MESSAGES = "_apiStatusMessages"
export const EXTENSION_STATUS_MESSAGES = "_extensionStatusMessages"

export const COMMENT_AGE_CONTENT_FILTER_ENABLED = "_commentAgeContentFilterEnabled"
export const COMMENT_IQ_CONTENT_FILTER_ENABLED = "_commentIqContentFilterEnabled"
export const COMMENT_SENTIMENT_POLARITY_CONTENT_FILTER_ENABLED = "_commentSentimentPolarityFilterEnabled"
export const COMMENT_SENTIMENT_SUBJECTIVITY_CONTENT_FILTER_ENABLED = "_commentSentimentSubjectivityFilterEnabled"
export const THREAD_SENTIMENT_POLARITY_CONTENT_FILTER_ENABLED = "_threadSentimentPolarityFilterEnabled"
export const THREAD_SENTIMENT_SUBJECTIVITY_CONTENT_FILTER_ENABLED = "_threadSentimentSubjectivityFilterEnabled"

export const HIDE_IGNORED_REDDITORS_ENABLED = "_hideIgnoredRedditorsEnabled"
export const HIDE_UNPROCESSABLE_REDDITORS_ENABLED = "_hideUnprocessableRedditorsEnabled"
export const HIDE_UNPROCESSABLE_THREADS_ENABLED = "_hideUnprocessableThreadsEnabled"

export const REDDITOR_CONTEXT_QUERY_PROCESSING_ENABLED = "_redditorContextQueryProcessingEnabled"
export const REDDITOR_DATA_PROCESSING_ENABLED = "_redditorDataProcessingEnabled"
export const THREAD_CONTEXT_QUERY_PROCESSING_ENABLED = "_threadContextQueryProcessingEnabled"
export const THREAD_DATA_PROCESSING_ENABLED = "_threadDataProcessingEnabled"

export const OPENAI_API_KEY = "_openaiApiKey"
export const PRODUCER_SETTINGS = "_producerSettings"

export const CACHED_PENDING_REDDITORS = "_cachedPendingRedditors"
export const CACHED_PROCESSED_REDDITORS = "_cachedProcessedRedditors"
export const CACHED_IGNORED_REDDITORS = "_cachedIgnoredRedditors"
export const CACHED_UNPROCESSABLE_REDDITORS = "_cachedUnprocessableRedditors"
export const CACHED_PENDING_THREADS = "_cachedPendingThreads"
export const CACHED_PROCESSED_THREADS = "_cachedProcessedThreads"
export const CACHED_UNPROCESSABLE_THREADS = "_cachedUnprocessableThreads"

// Do not reference the `defaultCommentFilter` object as a whole. If you do, updates to the default filter
// in storage will not be reflected because this is a static value. This exists mainly to initialize the default
// filter in storage and to prevent hardcoding string values.
export const defaultCommentFilter: types.CommentFilter = {
    age: 0,
    context: "Default",
    iq: 0,
    sentimentPolarity: 0.05,
    sentimentSubjectivity: 0.5,
    filterType: "default",
    uuid: crypto.randomUUID()
}

// Do not reference the `defaultThreadFilter` object as a whole. If you do, updates to the default filter
// in storage will not be reflected because this is a static value. This exists mainly to initialize the default
// filter in storage and to prevent hardcoding string values.
export const defaultThreadFilter: types.ThreadFilter = {
    context: "Default",
    sentimentPolarity: 0.05,
    sentimentSubjectivity: 0.5,
    filterType: "default",
    uuid: crypto.randomUUID()
}

export const defaultProducerSettings: types.ProducerSettings = {
    openai: {
        api_key: ""
    }
}

export const extensionStatusMessages: types.ExtensionStatusMessage[] = [
    {
        active: false,
        category: "danger",
        message: "",
        name: "apiRequestError",
        source: "extension"
    },
    {
        active: false,
        category: "warning",
        message: "Extension is disabled. Processing will not occur.",
        name: "extensionDisabled",
        source: "extension"
    },
    {
        active: false,
        category: "warning",
        message: "Authentication credentials are missing. Close extension and reauthenticate to add them.",
        name: "missingAuth",
        source: "extension"
    },
    {
        active: false,
        category: "warning",
        message: "Missing OpenAI API key. Processing will not occur until user's key is added to settings page.",
        name: "missingOpenAiApiKey",
        source: "extension"
    },
    {
        active: false,
        category: "danger",
        message: "", // set from the error message returned after attempting a test chat with the openai api
        name: "unusableOpenAiApiKey",
        source: "extension"
    }
]
