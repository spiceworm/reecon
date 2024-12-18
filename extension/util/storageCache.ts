import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const init = async (): Promise<void> => {
    await storage.setMany({
        [constants.CACHED_IGNORED_REDDITORS]: {} as Record<string, types.CachedIgnoredRedditor>,
        [constants.CACHED_PENDING_REDDITORS]: {} as Record<string, types.CachedPendingRedditor>,
        [constants.CACHED_PROCESSED_REDDITORS]: {} as Record<string, types.CachedProcessedRedditor>,
        [constants.CACHED_UNPROCESSABLE_REDDITORS]: {} as Record<string, types.CachedUnprocessableRedditor>,
        [constants.CACHED_PENDING_THREADS]: {} as Record<string, types.CachedPendingThread>,
        [constants.CACHED_PROCESSED_THREADS]: {} as Record<string, types.CachedProcessedThread>,
        [constants.CACHED_UNPROCESSABLE_THREADS]: {} as Record<string, types.CachedUnprocessableThread>
    })
}

const removeExpiredCachedRecords = <T extends types.CachedRecord>(records: Record<string, T>): Record<string, T> => {
    const now = new Date()

    Object.entries(records).map(([key, record]) => {
        if (new Date(record.expires) <= now) {
            delete records[key]
        }
    })

    return records
}

const getCachedRecords = async <T extends types.CachedRecord>(key: string): Promise<Record<string, T>> => {
    const staleRecords: Record<string, T> = await storage.get(key)
    const freshRecords: Record<string, T> = removeExpiredCachedRecords(staleRecords)
    await storage.set(key, freshRecords)
    return freshRecords
}

const setCachedRecords = async <T extends types.CachedRecord>(key: string, value: Record<string, T>): Promise<void> => {
    return storage.set(key, value)
}

export const getIgnoredRedditors = async (): Promise<Record<string, types.CachedIgnoredRedditor>> => {
    return getCachedRecords<types.CachedIgnoredRedditor>(constants.CACHED_IGNORED_REDDITORS)
}

export const getPendingRedditors = async (): Promise<Record<string, types.CachedPendingRedditor>> => {
    return getCachedRecords<types.CachedPendingRedditor>(constants.CACHED_PENDING_REDDITORS)
}

export const getProcessedRedditors = async (): Promise<Record<string, types.CachedProcessedRedditor>> => {
    return getCachedRecords<types.CachedProcessedRedditor>(constants.CACHED_PROCESSED_REDDITORS)
}

export const getPendingThreads = async (): Promise<Record<string, types.CachedPendingThread>> => {
    return getCachedRecords<types.CachedPendingThread>(constants.CACHED_PENDING_THREADS)
}

export const getProcessedThreads = async (): Promise<Record<string, types.CachedProcessedThread>> => {
    return getCachedRecords<types.CachedProcessedThread>(constants.CACHED_PROCESSED_THREADS)
}

export const getUnprocessableRedditors = async (): Promise<Record<string, types.CachedUnprocessableRedditor>> => {
    return getCachedRecords<types.CachedUnprocessableRedditor>(constants.CACHED_UNPROCESSABLE_REDDITORS)
}

export const getUnprocessableThreads = async (): Promise<Record<string, types.CachedUnprocessableThread>> => {
    return getCachedRecords<types.CachedUnprocessableThread>(constants.CACHED_UNPROCESSABLE_THREADS)
}

export const setIgnoredRedditors = async (records: Record<string, types.CachedIgnoredRedditor>): Promise<void> => {
    return setCachedRecords<types.CachedIgnoredRedditor>(constants.CACHED_IGNORED_REDDITORS, records)
}

export const setPendingRedditors = async (records: Record<string, types.CachedPendingRedditor>): Promise<void> => {
    return setCachedRecords<types.CachedPendingRedditor>(constants.CACHED_PENDING_REDDITORS, records)
}

export const setProcessedRedditors = async (records: Record<string, types.CachedProcessedRedditor>): Promise<void> => {
    return setCachedRecords<types.CachedProcessedRedditor>(constants.CACHED_PROCESSED_REDDITORS, records)
}

export const setPendingThreads = async (records: Record<string, types.CachedPendingThread>): Promise<void> => {
    return setCachedRecords<types.CachedPendingThread>(constants.CACHED_PENDING_THREADS, records)
}

export const setProcessedThreads = async (records: Record<string, types.CachedProcessedThread>): Promise<void> => {
    return setCachedRecords<types.CachedProcessedThread>(constants.CACHED_PROCESSED_THREADS, records)
}

export const setUnprocessableRedditors = async (records: Record<string, types.CachedUnprocessableRedditor>): Promise<void> => {
    return setCachedRecords<types.CachedUnprocessableRedditor>(constants.CACHED_UNPROCESSABLE_REDDITORS, records)
}

export const setUnprocessableThreads = async (records: Record<string, types.CachedUnprocessableThread>): Promise<void> => {
    return setCachedRecords<types.CachedUnprocessableThread>(constants.CACHED_UNPROCESSABLE_THREADS, records)
}
