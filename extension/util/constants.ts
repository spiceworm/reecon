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
