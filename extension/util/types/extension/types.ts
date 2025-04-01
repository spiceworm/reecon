import type { StatusMessage } from "~util/types/backend/reecon/modelSerializers"
import type { LoginResponse } from "~util/types/backend/server/apiSerializers"

export type Auth = LoginResponse

export interface ContentFilter {
    context: string
    filterType: string
    uuid: string
}

export interface CommentFilter extends ContentFilter {
    age: number
    iq: number
    sentimentPolarity: number
    sentimentSubjectivity: number
}

export type ExtensionStatusMessage = StatusMessage

export interface ThreadFilter extends ContentFilter {
    sentimentPolarity: number
    sentimentSubjectivity: number
}
