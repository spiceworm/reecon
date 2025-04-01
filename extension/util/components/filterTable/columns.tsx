import { createColumnHelper } from "@tanstack/react-table"

import * as cells from "~util/components/filterTable/cells"
import * as constants from "~util/constants"
import type { CommentFilter, ThreadFilter } from "~util/types/extension/types"
import * as validators from "~util/validators"

const action = (columnHelper) => {
    return columnHelper.display({
        id: "action",
        cell: cells.ActionCell
    })
}

const age = (columnHelper, storageKey: string) => {
    return columnHelper.accessor("age", {
        cell: cells.Cell,
        header: ({ table }) => <cells.ActionHeaderCell name={"Age"} storageKey={storageKey} table={table} />,
        id: "age",
        meta: {
            cast: parseInt,
            element: "input",
            type: "number",
            validators: [validators.requireInteger]
        }
    })
}

const context = (columnHelper) => {
    return columnHelper.accessor("context", {
        cell: cells.Cell,
        filterFn: "equals",
        header: <cells.HeaderCell name={"Context"} />,
        id: "context",
        meta: {
            cast: String,
            element: "input",
            type: "text",
            validators: [
                validators.requireValue,
                (value, table, excludedRowUUID: string) => {
                    validators.requireUnique(value, table.options.meta.getStoredContextNames(excludedRowUUID))
                }
            ]
        }
    })
}

const iq = (columnHelper, storageKey: string) => {
    return columnHelper.accessor("iq", {
        cell: cells.Cell,
        header: ({ table }) => <cells.ActionHeaderCell name={"IQ"} storageKey={storageKey} table={table} />,
        id: "iq",
        meta: {
            cast: parseInt,
            element: "input",
            type: "number",
            validators: [validators.requireInteger]
        }
    })
}

const sentimentPolarity = (columnHelper, storageKey: string) => {
    return columnHelper.accessor("sentimentPolarity", {
        cell: cells.Cell,
        header: ({ table }) => <cells.ActionHeaderCell name={"Polarity"} storageKey={storageKey} table={table} />,
        id: "sentimentPolarity",
        meta: {
            cast: parseFloat,
            element: "input",
            type: "number",
            step: "0.001",
            validators: [
                validators.requireFloat,
                (value) => {
                    validators.requireNumberBetween(value, -1.0, 1.0)
                }
            ]
        }
    })
}

const sentimentSubjectivity = (columnHelper, storageKey: string) => {
    return columnHelper.accessor("sentimentSubjectivity", {
        cell: cells.Cell,
        header: ({ table }) => <cells.ActionHeaderCell name={"Subjectivity"} storageKey={storageKey} table={table} />,
        id: "sentimentSubjectivity",
        meta: {
            cast: parseFloat,
            element: "input",
            type: "number",
            step: "0.001",
            validators: [
                validators.requireFloat,
                (value) => {
                    validators.requireNumberBetween(value, 0.0, 1.0)
                }
            ]
        }
    })
}

const commentColumnHelper = createColumnHelper<CommentFilter>()
export const CommentAction = action(commentColumnHelper)
export const CommentAge = age(commentColumnHelper, constants.COMMENT_AGE_CONTENT_FILTER_ENABLED)
export const CommentContext = context(commentColumnHelper)
export const CommentIq = iq(commentColumnHelper, constants.COMMENT_IQ_CONTENT_FILTER_ENABLED)
export const CommentSentimentPolarity = sentimentPolarity(commentColumnHelper, constants.COMMENT_SENTIMENT_POLARITY_CONTENT_FILTER_ENABLED)
export const CommentSentimentSubjectivity = sentimentSubjectivity(
    commentColumnHelper,
    constants.COMMENT_SENTIMENT_SUBJECTIVITY_CONTENT_FILTER_ENABLED
)

const threadColumnHelper = createColumnHelper<ThreadFilter>()
export const ThreadAction = action(threadColumnHelper)
export const ThreadContext = context(threadColumnHelper)
export const ThreadSentimentPolarity = sentimentPolarity(threadColumnHelper, constants.THREAD_SENTIMENT_POLARITY_CONTENT_FILTER_ENABLED)
export const ThreadSentimentSubjectivity = sentimentSubjectivity(threadColumnHelper, constants.THREAD_SENTIMENT_SUBJECTIVITY_CONTENT_FILTER_ENABLED)
