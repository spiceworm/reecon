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
    const [editableRows, setEditableRows] = useState({})
    const [validationErrors, setValidationErrors] = useState<Record<number, Record<string, string>>>({})

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        initialState: {
            columnFilters: columnFilters
        },
        meta: {
            addRow: (): T[] => {
                data.push({ ...newRow })
                setRenderedData([...data])
                return data
            },
            data,
            getCellValidationError: (rowIndex: number, columnId: string): string => {
                return validationErrors?.[rowIndex]?.[columnId] ?? ""
            },
            getStoredContextNames: (): string[] => {
                return storageData.map((row: T) => row.context)
            },
            headerControlsVisible: headerControlsVisible,
            removeRow: async (rowIndex: number): Promise<void> => {
                delete validationErrors[rowIndex]
                setValidationErrors({ ...validationErrors })

                data.splice(rowIndex, 1)
                setRenderedData([...data])
                await setStorageData([...data])
            },
            resetRowValidationErrors: (rowIndex: number): void => {
                let _validationErrors = { ...validationErrors }
                _validationErrors[rowIndex] ??= {}
                table.options.columns.map((column) => {
                    if (column.id !== "action") {
                        _validationErrors[rowIndex][column.id] = ""
                    }
                })
                setValidationErrors(_validationErrors)
            },
            rowHasValidationErrors: (rowIndex: number): boolean => {
                return Object.values(validationErrors[rowIndex]).some((s: string) => s.length > 0)
            },
            rowEditingInProgress: (): boolean => {
                return Object.values(editableRows).some((rowIsEditable) => rowIsEditable)
            },
            rowIsEditable: (rowIndex: number): boolean => {
                return editableRows[rowIndex]
            },
            setStorageData,
            setRowEditingState: (rowId: number, editingEnabled: boolean): void => {
                setEditableRows((existingEditable: []) => ({
                    ...existingEditable,
                    [rowId]: editingEnabled
                }))
            },
            validateCellInput: (value: any, columnMeta, columnId: string, rowIndex: number): boolean => {
                let _validationErrors = { ...validationErrors }
                _validationErrors[rowIndex] ??= {}

                for (const validatorFn of columnMeta.validators) {
                    try {
                        validatorFn(value, table)
                        _validationErrors[rowIndex][columnId] = ""
                        setValidationErrors({ ..._validationErrors })
                    } catch (error: unknown) {
                        if (error instanceof errors.ValidationError) {
                            _validationErrors[rowIndex][columnId] = error.message
                            setValidationErrors({ ..._validationErrors })
                        } else {
                            console.error(`Unhandled error caught when validating ${value} in ${columnId} column.`)
                        }
                        return false
                    }
                }
                return true
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
            updateRenderedData: (rowIndex: number, columnId: string, value: string): void => {
                data[rowIndex][columnId] = value
                setRenderedData([...data])
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
    const [commentFilters, setCommentFilters, { isLoading }] = useStorage<types.CommentFilter[]>(
        { instance: storage.extLocalStorage, key: constants.ALL_COMMENT_FILTERS },
        (v) => (v === undefined ? [] : v)
    )

    const [defaultFilter] = useStorage<types.CommentFilter>({ instance: storage.extLocalStorage, key: constants.DEFAULT_COMMENT_FILTER }, (v) =>
        v === undefined ? ({} as types.CommentFilter) : v
    )

    const newRow = {
        age: defaultFilter.age,
        context: "",
        filterType: "custom",
        iq: defaultFilter.iq,
        sentimentPolarity: defaultFilter.sentimentPolarity,
        sentimentSubjectivity: defaultFilter.sentimentSubjectivity
    }

    const [renderData, setRenderedData] = useState<types.CommentFilter[]>([])

    if (!isLoading && renderData.length === 0) {
        setRenderedData([...commentFilters])
    }

    return (
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
    )
}

const threadFilterTableColumns = [columns.ThreadContext, columns.ThreadSentimentPolarity, columns.ThreadSentimentSubjectivity, columns.ThreadAction]

export const ThreadFilterTable = ({ columnFilters, columnVisibility, footerVisible, headerControlsVisible }) => {
    const [threadFilters, setThreadFilters, { isLoading }] = useStorage<types.ThreadFilter[]>(
        { instance: storage.extLocalStorage, key: constants.ALL_THREAD_FILTERS },
        (v) => (v === undefined ? [] : v)
    )

    const [defaultFilter] = useStorage<types.ThreadFilter>({ instance: storage.extLocalStorage, key: constants.DEFAULT_THREAD_FILTER }, (v) =>
        v === undefined ? ({} as types.ThreadFilter) : v
    )

    const newRow = {
        context: "",
        filterType: "custom",
        sentimentPolarity: defaultFilter.sentimentPolarity,
        sentimentSubjectivity: defaultFilter.sentimentSubjectivity
    }

    const [renderData, setRenderedData] = useState<types.ThreadFilter[]>([])

    if (!isLoading && renderData.length === 0) {
        setRenderedData([...threadFilters])
    }

    return (
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
    )
}
