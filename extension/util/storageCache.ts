import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type {
    CachedIgnoredRedditor,
    CachedPendingRedditor,
    CachedPendingThread,
    CachedProcessedRedditor,
    CachedProcessedThread,
    CachedRecord,
    CachedUnprocessableRedditor,
    CachedUnprocessableThread
} from "~util/types/extension/cache"

export const init = async (): Promise<void> => {
    await storage.setMany({
        [constants.CACHED_IGNORED_REDDITORS]: {} as Record<string, CachedIgnoredRedditor>,
        [constants.CACHED_PENDING_REDDITORS]: {} as Record<string, CachedPendingRedditor>,
        [constants.CACHED_PROCESSED_REDDITORS]: {} as Record<string, CachedProcessedRedditor>,
        [constants.CACHED_UNPROCESSABLE_REDDITORS]: {} as Record<string, CachedUnprocessableRedditor>,
        [constants.CACHED_PENDING_THREADS]: {} as Record<string, CachedPendingThread>,
        [constants.CACHED_PROCESSED_THREADS]: {} as Record<string, CachedProcessedThread>,
        [constants.CACHED_UNPROCESSABLE_THREADS]: {} as Record<string, CachedUnprocessableThread>
    })
}

const removeExpiredCachedRecords = <T extends CachedRecord>(records: Record<string, T>): Record<string, T> => {
    const now = new Date()

    Object.entries(records).map(([key, record]) => {
        if (new Date(record.expires) <= now) {
            delete records[key]
        }
    })

    return records
}

const getCachedRecords = async <T extends CachedRecord>(key: string): Promise<Record<string, T>> => {
    const staleRecords: Record<string, T> = await storage.get(key)
    const freshRecords: Record<string, T> = removeExpiredCachedRecords(staleRecords)
    await storage.set(key, freshRecords)
    return freshRecords
}

const setCachedRecords = async <T extends CachedRecord>(key: string, value: Record<string, T>): Promise<void> => {
    return storage.set(key, value)
}

export const getIgnoredRedditors = async (): Promise<Record<string, CachedIgnoredRedditor>> => {
    return getCachedRecords<CachedIgnoredRedditor>(constants.CACHED_IGNORED_REDDITORS)
}

export const getPendingRedditors = async (): Promise<Record<string, CachedPendingRedditor>> => {
    return getCachedRecords<CachedPendingRedditor>(constants.CACHED_PENDING_REDDITORS)
}

export const getProcessedRedditors = async (): Promise<Record<string, CachedProcessedRedditor>> => {
    return getCachedRecords<CachedProcessedRedditor>(constants.CACHED_PROCESSED_REDDITORS)
}

export const getPendingThreads = async (): Promise<Record<string, CachedPendingThread>> => {
    return getCachedRecords<CachedPendingThread>(constants.CACHED_PENDING_THREADS)
}

export const getProcessedThreads = async (): Promise<Record<string, CachedProcessedThread>> => {
    return getCachedRecords<CachedProcessedThread>(constants.CACHED_PROCESSED_THREADS)
}

export const getUnprocessableRedditors = async (): Promise<Record<string, CachedUnprocessableRedditor>> => {
    return getCachedRecords<CachedUnprocessableRedditor>(constants.CACHED_UNPROCESSABLE_REDDITORS)
}

export const getUnprocessableThreads = async (): Promise<Record<string, CachedUnprocessableThread>> => {
    return getCachedRecords<CachedUnprocessableThread>(constants.CACHED_UNPROCESSABLE_THREADS)
}

export const setIgnoredRedditors = async (records: Record<string, CachedIgnoredRedditor>): Promise<void> => {
    return setCachedRecords<CachedIgnoredRedditor>(constants.CACHED_IGNORED_REDDITORS, records)
}

export const setPendingRedditors = async (records: Record<string, CachedPendingRedditor>): Promise<void> => {
    return setCachedRecords<CachedPendingRedditor>(constants.CACHED_PENDING_REDDITORS, records)
}

export const setProcessedRedditors = async (records: Record<string, CachedProcessedRedditor>): Promise<void> => {
    return setCachedRecords<CachedProcessedRedditor>(constants.CACHED_PROCESSED_REDDITORS, records)
}

export const setPendingThreads = async (records: Record<string, CachedPendingThread>): Promise<void> => {
    return setCachedRecords<CachedPendingThread>(constants.CACHED_PENDING_THREADS, records)
}

export const setProcessedThreads = async (records: Record<string, CachedProcessedThread>): Promise<void> => {
    return setCachedRecords<CachedProcessedThread>(constants.CACHED_PROCESSED_THREADS, records)
}

export const setUnprocessableRedditors = async (records: Record<string, CachedUnprocessableRedditor>): Promise<void> => {
    return setCachedRecords<CachedUnprocessableRedditor>(constants.CACHED_UNPROCESSABLE_REDDITORS, records)
}

export const setUnprocessableThreads = async (records: Record<string, CachedUnprocessableThread>): Promise<void> => {
    return setCachedRecords<CachedUnprocessableThread>(constants.CACHED_UNPROCESSABLE_THREADS, records)
}
