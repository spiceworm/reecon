import type * as types from "~util/types"

export const ACTIVE_CONTENT_FILTER = "_activeContentFilter"
export const AUTH = "_auth"
export const CONTENT_FILTERS = "_contentFilters"
export const DEFAULT_FILTER = "_defaultFilter"
export const DISABLE_EXTENSION = "_disableExtension"
export const HIDE_BAD_SENTIMENT_THREADS = "_hideBadSentimentThreads"
export const HIDE_IGNORED_REDDITORS = "_hideIgnoredRedditors"
export const LOCAL_STATUS_MESSAGES = "_localStatusMessages"
export const OPENAI_API_KEY = "_unvalidatedOpenaiApiKey"

export const defaultContentFilter: types.ContentFilter = {
  age: 0,
  context: "Default",
  iq: 0,
  sentiment: 0.05,
  filterType: "default"
}

export const localStatusMessages: types.StatusMessage[] = [
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
    message:
      "Authentication credentials are missing. Close extension and reauthenticate to add them.",
    name: "missingAuth",
    source: "extension"
  },
  {
    active: false,
    category: "warning",
    message:
      "Missing OpenAI API key. Processing will not occur until user's key is added to settings page.",
    name: "missingOpenAiApiKey",
    source: "extension"
  }
]
