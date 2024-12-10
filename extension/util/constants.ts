import type * as types from "~util/types"

export const ACTIVE_CONTENT_FILTER = "_activeContentFilter"
export const API_STATUS_MESSAGES = "_apiStatusMessages"
export const AUTH = "_auth"
export const CONTENT_FILTERS = "_contentFilters"
export const DEFAULT_FILTER = "_defaultFilter"
export const DISABLE_EXTENSION = "_disableExtension"
export const EXTENSION_STATUS_MESSAGES = "_extensionStatusMessages"
export const HIDE_BAD_SENTIMENT_THREADS = "_hideBadSentimentThreads"
export const OPENAI_API_KEY = "_unvalidatedOpenaiApiKey"
export const PRODUCER_SETTINGS = "_producerSettings"
export const REDDITOR_CONTEXT_QUERY_PROCESSING_ENABLED = "_redditorContextQueryProcessingEnabled"
export const REDDITOR_DATA_PROCESSING_ENABLED = "_redditorDataProcessingEnabled"
export const STATUS_MESSAGES = "_statusMessages"
export const THREAD_CONTEXT_QUERY_PROCESSING_ENABLED = "_threadContextQueryProcessingEnabled"
export const THREAD_DATA_PROCESSING_ENABLED = "_threadDataProcessingEnabled"

export const defaultContentFilter: types.ContentFilter = {
    age: 0,
    context: "Default",
    iq: 0,
    sentiment: 0.05,
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
    }
]
