// https://muhimasri.com/blogs/react-editable-table/
// https://muhimasri.com/blogs/add-remove-react-table-rows/
import { createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { Check, Pencil, Plus, Trash } from "react-bootstrap-icons"
import { Button, ButtonGroup, Input, InputGroup, Table } from "reactstrap"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as constants from "~util/constants"
import * as errors from "~util/errors"
import * as storage from "~util/storage"
import type * as types from "~util/types"
import * as validators from "~util/validators"

const columnHelper = createColumnHelper<types.CommentContentFilter>()

const Cell = ({ getValue, row, column, table }) => {
    const initialValue = getValue()
    const columnMeta = column.columnDef.meta
    const tableMeta = table.options.meta

    const [renderValue, setRenderValue] = useState(initialValue)

    const isContextCell = column.columnDef.id === "context"
    const isDefaultContextCell = isContextCell && row.original.filterType === constants.defaultCommentContentFilter.filterType

    useEffect(() => {
        // When a new row is added, validate the new row values so a validation error is triggered for the empty
        // context field.
        tableMeta.validateCellInput(initialValue, columnMeta, column.id, row.index)

        if (initialValue !== renderValue) {
            setRenderValue(initialValue)
        }
    }, [initialValue])

    const onChangeHandler = (e) => {
        let value = e.target.value

        if (tableMeta.validateCellInput(value, columnMeta, column.id, row.index)) {
            value = columnMeta.cast(value)
        }

        setRenderValue(value)
        tableMeta.updateRenderedData(row.index, column.id, value)
    }

    const validationError = tableMeta.getCellValidationError(row.index, column.columnDef.id)

    if (columnMeta.element === "input") {
        return (
            <InputGroup key={`row-${row.index}-col-${column.id}-ig`}>
                {isContextCell && !isDefaultContextCell ? (
                    <span className={"input-group-text"} key={`row-${row.index}-col-${column.id}-span`}>
                        /r/
                    </span>
                ) : null}
                <Input
                    disabled={isDefaultContextCell || !tableMeta.rowIsEditable(row.index)}
                    invalid={validationError.length > 0}
                    key={`row-${row.index}-col-${column.id}-input`}
                    onChange={onChangeHandler}
                    readOnly={isDefaultContextCell || !tableMeta.rowIsEditable(row.index)}
                    step={columnMeta.step ? columnMeta.step : null}
                    title={validationError.length > 0 ? validationError : renderValue}
                    type={columnMeta.type}
                    value={renderValue}
                />
            </InputGroup>
        )
    } else {
        console.error(`Unhandled column meta element: ${columnMeta.element}`)
    }
}

const ActionCell = ({ row, table }) => {
    const tableMeta = table.options.meta

    const onDeleteClickHandler = () => {
        tableMeta.removeRow(row.index)
    }

    const onEditClickHandler = () => {
        tableMeta.resetRowValidationErrors(row.index)
        tableMeta.setRowEditingState(row.index, true)
    }

    const onSaveClickHandler = async () => {
        tableMeta.data.map((row, rowIndex) => {
            Object.entries(row).map(([colName, value]) => {
                console.log(`${rowIndex}) ${colName}=${value} (${typeof value}, isFloat=${Number(value) === value && value % 1 !== 0})`)
            })
        })

        if (!tableMeta.rowHasValidationErrors(row.index)) {
            await tableMeta.setContentFilters([...tableMeta.data])
            tableMeta.setRowEditingState(row.index, false)
        }
    }

    return (
        <ButtonGroup>
            <>
                {tableMeta.rowIsEditable(row.index) ? (
                    <Button color={"success"} disabled={tableMeta.rowHasValidationErrors(row.index)} onClick={onSaveClickHandler}>
                        <Check />
                    </Button>
                ) : (
                    <Button
                        color={"secondary"}
                        // Only allow one row to be edited at a time.
                        disabled={tableMeta.rowEditingInProgress()}
                        onClick={onEditClickHandler}>
                        <Pencil />
                    </Button>
                )}
                {row.original.filterType !== constants.defaultCommentContentFilter.filterType ? (
                    <Button
                        color={"danger"}
                        // Do not allow deletion if validation errors exist anywhere in the table because deleting
                        // causes the all rendered rows to be saved. We do not want to save a row that contains errors.
                        // We also do not want to save a different row that is still being edited that is not yet saved.
                        disabled={tableMeta.tableHasValidationErrors() || tableMeta.rowEditingInProgress()}
                        key={`row-${row.index}-action`}
                        onClick={onDeleteClickHandler}
                        title={"Delete"}>
                        <Trash key={`row-${row.index}-icon`} />
                    </Button>
                ) : null}
            </>
        </ButtonGroup>
    )
}

const HeaderCell = ({ name, storageKey, table }) => {
    const [filterEnabled, setFilterEnabled] = useStorage<boolean>({ instance: storage.extLocalStorage, key: storageKey }, (v) =>
        v === undefined ? false : v
    )

    const onChangeHandler = async (e) => {
        await setFilterEnabled(e.target.checked)
    }

    if (table.options.meta.headerControlsVisible) {
        return (
            <span>
                {name}{" "}
                <Input
                    checked={filterEnabled}
                    onChange={onChangeHandler}
                    title={`${name} content filter is ${filterEnabled ? "enabled" : "disabled"}`}
                    type={"checkbox"}
                />
            </span>
        )
    }
    return name
}

const FooterCell = ({ table }) => {
    const tableMeta = table.options.meta

    const onClickHandler = () => {
        const newTableData = tableMeta.addRow()
        const newRowIndex = newTableData.length - 1
        tableMeta.resetRowValidationErrors(newRowIndex)
        tableMeta.setRowEditingState(newRowIndex, true)
    }

    return (
        <div className={"d-flex justify-content-center"}>
            <Button
                color={"success"}
                disabled={tableMeta.tableHasValidationErrors() || tableMeta.rowEditingInProgress()}
                onClick={onClickHandler}
                title={"Add new row"}>
                Add New <Plus />
            </Button>
        </div>
    )
}

const columns = [
    columnHelper.accessor("context", {
        cell: Cell,
        header: "Context",
        id: "context",
        meta: {
            cast: String,
            element: "input",
            type: "text",
            validators: [
                validators.requireValue,
                (value, table) => {
                    validators.requireUnique(value, table.options.meta.getStoredContextNames())
                }
            ]
        }
    }),
    columnHelper.accessor("age", {
        cell: Cell,
        header: ({ table }) => <HeaderCell name={"Age"} storageKey={constants.AGE_CONTENT_FILTER_ENABLED} table={table} />,
        id: "age",
        meta: {
            cast: parseInt,
            element: "input",
            type: "number",
            validators: [validators.requireInteger]
        }
    }),
    columnHelper.accessor("iq", {
        cell: Cell,
        header: ({ table }) => <HeaderCell name={"IQ"} storageKey={constants.IQ_CONTENT_FILTER_ENABLED} table={table} />,
        id: "iq",
        meta: {
            cast: parseInt,
            element: "input",
            type: "number",
            validators: [validators.requireInteger]
        }
    }),
    columnHelper.accessor("sentimentPolarity", {
        cell: Cell,
        header: ({ table }) => <HeaderCell name={"Polarity"} storageKey={constants.SENTIMENT_POLARITY_CONTENT_FILTER_ENABLED} table={table} />,
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
    }),
    columnHelper.accessor("sentimentSubjectivity", {
        cell: Cell,
        header: ({ table }) => (
            <HeaderCell name={"Subjectivity"} storageKey={constants.SENTIMENT_SUBJECTIVITY_CONTENT_FILTER_ENABLED} table={table} />
        ),
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
    }),
    columnHelper.display({
        id: "action",
        cell: ActionCell
    })
]

const defaultColumnFilters = []
const defaultColumnVisibility = {
    context: true,
    age: true,
    iq: true,
    sentimentPolarity: true,
    sentimentSubjectivity: true,
    action: true
}

export const ContentFilterTable = ({
    columnVisibility = defaultColumnVisibility,
    columnFilters = defaultColumnFilters,
    footerVisible = true,
    headerControlsVisible = false
}) => {
    const [contentFilters, setContentFilters, { isLoading }] = useStorage<types.CommentContentFilter[]>(
        { instance: storage.extLocalStorage, key: constants.COMMENT_CONTENT_FILTERS },
        (v) => (v === undefined ? [] : v)
    )

    const [defaultFilter] = useStorage<types.CommentContentFilter>({ instance: storage.extLocalStorage, key: constants.DEFAULT_COMMENT_FILTER }, (v) =>
        v === undefined ? ({} as types.CommentContentFilter) : v
    )

    const [data, setRenderedData] = useState<types.CommentContentFilter[]>([])
    const [editableRows, setEditableRows] = useState({})
    const [validationErrors, setValidationErrors] = useState<Record<number, Record<string, string>>>({})

    if (!isLoading && data.length === 0) {
        setRenderedData([...contentFilters])
    }

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        initialState: {
            columnFilters: columnFilters
        },
        meta: {
            addRow: (): types.CommentContentFilter[] => {
                const newContentFilter: types.CommentContentFilter = {
                    age: defaultFilter.age,
                    context: "",
                    filterType: "custom",
                    iq: defaultFilter.iq,
                    sentimentPolarity: defaultFilter.sentimentPolarity,
                    sentimentSubjectivity: defaultFilter.sentimentSubjectivity
                }
                data.push(newContentFilter)
                setRenderedData([...data])
                return data
            },
            data,
            getCellValidationError: (rowIndex: number, columnId: string): string => {
                return validationErrors?.[rowIndex]?.[columnId] ?? ""
            },
            getStoredContextNames: (): string[] => {
                return contentFilters.map((row: types.CommentContentFilter) => row.context)
            },
            headerControlsVisible: headerControlsVisible,
            removeRow: async (rowIndex: number) => {
                delete validationErrors[rowIndex]
                setValidationErrors({ ...validationErrors })

                data.splice(rowIndex, 1)
                setRenderedData([...data])
                await setContentFilters([...data])
            },
            resetRowValidationErrors: (rowIndex: number) => {
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
            setContentFilters,
            setRowEditingState: (rowId: number, editingEnabled: boolean) => {
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
            updateRenderedData: async (rowIndex: number, columnId: string, value: string) => {
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
                            <FooterCell table={table} />
                        </th>
                    </tr>
                ) : null}
            </tfoot>
        </Table>
    )
}
