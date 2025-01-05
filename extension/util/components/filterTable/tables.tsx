import { flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table"
import { useState } from "react"
import { Table } from "reactstrap"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as cells from "~util/components/filterTable/cells"
import * as columns from "~util/components/filterTable/columns"
import * as constants from "~util/constants"
import * as errors from "~util/errors"
import * as storage from "~util/storage"
import type * as types from "~util/types"

const FilterTable = <T extends types.ContentFilter>({
    data,
    columns,
    columnFilters,
    columnVisibility,
    footerVisible,
    headerControlsVisible,
    newRow,
    setRenderedData,
    setStorageData,
    storageData
}) => {
    const [editableRows, setEditableRows] = useState<Record<string, boolean>>({})
    const [validationErrors, setValidationErrors] = useState<Record<string, Record<string, string>>>({})

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        initialState: {
            columnFilters: columnFilters
        },
        meta: {
            addRow: (): string => {
                const rowUUID = crypto.randomUUID()

                data.push({ ...newRow, uuid: rowUUID })
                setRenderedData([...data])

                return rowUUID
            },
            getCellValidationError: (rowUUID: string, columnId: string): string => {
                return validationErrors?.[rowUUID]?.[columnId] ?? ""
            },
            getStoredContextNames: (excludedRowUUID: string): string[] => {
                return Object.values(storageData)
                    .filter((row: T) => row.uuid !== excludedRowUUID)
                    .map((row: T) => row.context)
            },
            headerControlsVisible: headerControlsVisible,
            removeRow: async (rowUUID: string): Promise<void> => {
                delete editableRows[rowUUID]
                setEditableRows({ ...editableRows })

                delete validationErrors[rowUUID]
                setValidationErrors({ ...validationErrors })

                setRenderedData([...data.filter((row: T) => row.uuid !== rowUUID)])

                Object.values(storageData).filter((row: T) => (row.uuid === rowUUID ? delete storageData[row.context] : null))
                await setStorageData({ ...storageData })
            },
            resetRowValidationErrors: (rowUUID: string): void => {
                validationErrors[rowUUID] ??= {}

                table.options.columns.map((column) => {
                    if (column.id !== "action") {
                        validationErrors[rowUUID][column.id] = ""
                    }
                })
                setValidationErrors({ ...validationErrors })
            },
            rowHasValidationErrors: (rowUUID: string): boolean => {
                return Object.values(validationErrors[rowUUID]).some((s: string) => s.length > 0)
            },
            rowEditingInProgress: (): boolean => {
                return Object.values(editableRows).some((rowIsEditable) => rowIsEditable)
            },
            rowIsEditable: (rowUUID: string): boolean => {
                return editableRows[rowUUID]
            },
            setRowEditingState: (rowUUID: string, editingEnabled: boolean): void => {
                editableRows[rowUUID] = editingEnabled
                setEditableRows({ ...editableRows })
            },
            tableHasValidationErrors: (): boolean => {
                for (const rowValidationErrorMessages of Object.values(validationErrors)) {
                    for (const columnValidationErrorMessage of Object.values(rowValidationErrorMessages)) {
                        if (columnValidationErrorMessage.length > 0) {
                            return true
                        }
                    }
                }
                return false
            },
            updateRenderedData: (rowUUID: string, columnId: string, value: string): void => {
                for (let [index, row] of data.entries()) {
                    if (row.uuid === rowUUID) {
                        data[index][columnId] = value
                        setRenderedData([...data])
                        break
                    }
                }
            },
            updateStorageRow: async (rowUUID: string): Promise<void> => {
                const updatedRow = data.filter((row: T) => row.uuid === rowUUID)[0]
                storageData[updatedRow.context] = updatedRow
                await setStorageData({ ...storageData })
            },
            validateCell: (value: any, columnMeta, columnId: string, rowUUID: string): boolean => {
                let _validationErrors = { ...validationErrors }
                _validationErrors[rowUUID] ??= {}

                for (const validatorFn of columnMeta.validators) {
                    try {
                        validatorFn(value, table, rowUUID)
                        _validationErrors[rowUUID][columnId] = ""
                        setValidationErrors({ ..._validationErrors })
                    } catch (error: unknown) {
                        if (error instanceof errors.ValidationError) {
                            _validationErrors[rowUUID][columnId] = error.message
                            setValidationErrors({ ..._validationErrors })
                        } else {
                            console.error(`Unhandled error caught when validating ${value} in ${columnId} column.`)
                        }
                        return false
                    }
                }
                return true
            }
        },
        state: {
            columnFilters,
            columnVisibility
        }
    })

    return (
        <Table>
            <thead>
                {table.getHeaderGroups().map((headerGroup) => {
                    return (
                        <tr key={`tr-${headerGroup.id}`}>
                            {headerGroup.headers.map((header, idx) => {
                                return (
                                    <th key={`tr-${headerGroup.id}-th-${header.id}-${idx}`}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                )
                            })}
                        </tr>
                    )
                })}
            </thead>
            <tbody>
                {table.getRowModel().rows.map((row) => {
                    return (
                        <tr key={`tr-${row.id}`}>
                            {row.getVisibleCells().map((cell) => {
                                return <td key={`tr-${row.id}-td-${cell.id}`}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                            })}
                        </tr>
                    )
                })}
            </tbody>
            <tfoot>
                {footerVisible ? (
                    <tr key={"tr-footer"}>
                        <th colSpan={table.getCenterLeafColumns().length}>
                            <cells.FooterCell table={table} />
                        </th>
                    </tr>
                ) : null}
            </tfoot>
        </Table>
    )
}

const commentFilterTableColumns = [
    columns.CommentContext,
    columns.CommentAge,
    columns.CommentIq,
    columns.CommentSentimentPolarity,
    columns.CommentSentimentSubjectivity,
    columns.CommentAction
]

export const CommentFilterTable = ({ columnFilters, columnVisibility, footerVisible, headerControlsVisible }) => {
    const [commentFilters, setCommentFilters, { isLoading }] = useStorage<Record<string, types.CommentFilter>>(
        { instance: storage.extLocalStorage, key: constants.ALL_COMMENT_FILTERS },
        (v) => (v === undefined ? {} : v)
    )

    const [defaultFilter] = useStorage<types.CommentFilter>(
        {
            instance: storage.extLocalStorage,
            key: constants.DEFAULT_COMMENT_FILTER
        },
        (v) => (v === undefined ? ({} as types.CommentFilter) : v)
    )

    const newRow: types.CommentFilter = {
        age: defaultFilter.age,
        context: "",
        filterType: "custom",
        iq: defaultFilter.iq,
        sentimentPolarity: defaultFilter.sentimentPolarity,
        sentimentSubjectivity: defaultFilter.sentimentSubjectivity,
        uuid: ""
    }

    const [renderData, setRenderedData] = useState<types.CommentFilter[]>([])

    if (!isLoading && renderData.length === 0) {
        setRenderedData(Object.values(commentFilters))
    }

    return (
        <>
            <h5 className={"text-center"}>Comment Filters</h5>
            <FilterTable<types.CommentFilter>
                columns={commentFilterTableColumns}
                columnFilters={columnFilters}
                columnVisibility={columnVisibility}
                data={renderData}
                footerVisible={footerVisible}
                headerControlsVisible={headerControlsVisible}
                newRow={newRow}
                setRenderedData={setRenderedData}
                setStorageData={setCommentFilters}
                storageData={commentFilters}
            />
        </>
    )
}

const threadFilterTableColumns = [columns.ThreadContext, columns.ThreadSentimentPolarity, columns.ThreadSentimentSubjectivity, columns.ThreadAction]

export const ThreadFilterTable = ({ columnFilters, columnVisibility, footerVisible, headerControlsVisible }) => {
    const [threadFilters, setThreadFilters, { isLoading }] = useStorage<Record<string, types.ThreadFilter>>(
        { instance: storage.extLocalStorage, key: constants.ALL_THREAD_FILTERS },
        (v) => (v === undefined ? {} : v)
    )

    const [defaultFilter] = useStorage<types.ThreadFilter>(
        {
            instance: storage.extLocalStorage,
            key: constants.DEFAULT_THREAD_FILTER
        },
        (v) => (v === undefined ? ({} as types.ThreadFilter) : v)
    )

    const newRow: types.ThreadFilter = {
        context: "",
        filterType: "custom",
        sentimentPolarity: defaultFilter.sentimentPolarity,
        sentimentSubjectivity: defaultFilter.sentimentSubjectivity,
        uuid: ""
    }

    const [renderData, setRenderedData] = useState<types.ThreadFilter[]>([])

    if (!isLoading && renderData.length === 0) {
        setRenderedData(Object.values(threadFilters))
    }

    return (
        <>
            <h5 className={"text-center"}>Thread Filters</h5>
            <FilterTable<types.ThreadFilter>
                columns={threadFilterTableColumns}
                columnFilters={columnFilters}
                columnVisibility={columnVisibility}
                data={renderData}
                footerVisible={footerVisible}
                headerControlsVisible={headerControlsVisible}
                newRow={newRow}
                setRenderedData={setRenderedData}
                setStorageData={setThreadFilters}
                storageData={threadFilters}
            />
        </>
    )
}