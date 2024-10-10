export interface Auth {
    access: string;
    refresh: string;
}


export interface ContentFilter {
    age: number
    context: string
    filterType: string
    iq: number
    sentiment: number
}


export interface IgnoredRedditor {
    username: string;
    reason: string;
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


export interface Redditor {
    created: Date
    data: RedditorData
    last_processed: Date
    username: string
}


interface RedditorData {
    age: ProducedInteger
    iq: ProducedInteger
    interests: ProducedTextList
    sentiment_polarity: ProducedFloat
    summary: ProducedText
}


export interface Thread {
    created: Date
    data: ThreadData
    last_processed: Date
    path: string
    url: string
}


interface ThreadData {
    keywords: ProducedTextList
    sentiment_polarity: ProducedFloat
    summary: ProducedText
}
