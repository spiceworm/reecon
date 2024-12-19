import type * as types from "~util/types"

export const ACTIVE_CONTENT_FILTER = "_activeContentFilter"
export const AGE_CONTENT_FILTER_ENABLED = "_ageContentFilterEnabled"
export const API_STATUS_MESSAGES = "_apiStatusMessages"
export const AUTH = "_auth"
export const CONTENT_FILTERS = "_contentFilters"
export const DEFAULT_FILTER = "_defaultFilter"
export const DISABLE_EXTENSION = "_disableExtension"
export const EXTENSION_STATUS_MESSAGES = "_extensionStatusMessages"
export const IQ_CONTENT_FILTER_ENABLED = "_iqContentFilterEnabled"
export const OPENAI_API_KEY = "_openaiApiKey"
export const PRODUCER_SETTINGS = "_producerSettings"
export const REDDITOR_CONTEXT_QUERY_PROCESSING_ENABLED = "_redditorContextQueryProcessingEnabled"
export const REDDITOR_DATA_PROCESSING_ENABLED = "_redditorDataProcessingEnabled"
export const SENTIMENT_POLARITY_CONTENT_FILTER_ENABLED = "_sentimentPolarityFilterEnabled"
export const SENTIMENT_SUBJECTIVITY_CONTENT_FILTER_ENABLED = "_sentimentSubjectivityFilterEnabled"
export const STATUS_MESSAGES = "_statusMessages"
export const THREAD_CONTEXT_QUERY_PROCESSING_ENABLED = "_threadContextQueryProcessingEnabled"
export const THREAD_DATA_PROCESSING_ENABLED = "_threadDataProcessingEnabled"

export const CACHED_PENDING_REDDITORS = "_cachedPendingRedditors"
export const CACHED_PROCESSED_REDDITORS = "_cachedProcessedRedditors"
export const CACHED_IGNORED_REDDITORS = "_cachedIgnoredRedditors"
export const CACHED_UNPROCESSABLE_REDDITORS = "_cachedUnprocessableRedditors"
export const CACHED_PENDING_THREADS = "_cachedPendingThreads"
export const CACHED_PROCESSED_THREADS = "_cachedProcessedThreads"
export const CACHED_UNPROCESSABLE_THREADS = "_cachedUnprocessableThreads"

// Do not reference the `defaultContentFilter` object as a whole. If you do, updates to the default filter
// in storage will not be reflected because this is a static value. This exists mainly to initialize the
// default filter in storage and to prevent hardcoding string values.
export const defaultContentFilter: types.ContentFilter = {
    age: 0,
    context: "Default",
    iq: 0,
    sentimentPolarity: 0.05,
    sentimentSubjectivity: 0.5,
    filterType: "default"
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
