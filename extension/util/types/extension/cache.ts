import type {
    IgnoredRedditor,
    ProcessedRedditor,
    ProcessedThread,
    UnprocessableRedditor,
    UnprocessableThread
} from "~util/types/backend/reecon/modelSerializers"
import type { PendingRedditor, PendingThread } from "~util/types/backend/server/apiSerializers"

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
    value: ProcessedRedditor
}

export interface CachedUnprocessableRedditor extends CachedRecord {
    value: UnprocessableRedditor
}

export interface CachedPendingThread extends CachedRecord {
    value: PendingThread
}

export interface CachedProcessedThread extends CachedRecord {
    value: ProcessedThread
}

export interface CachedUnprocessableThread extends CachedRecord {
    value: UnprocessableThread
}
