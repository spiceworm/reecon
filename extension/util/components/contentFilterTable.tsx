// https://muhimasri.com/blogs/react-editable-table/
// https://muhimasri.com/blogs/add-remove-react-table-rows/
import { createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { Plus, Trash } from "react-bootstrap-icons"
import { Button, Input, InputGroup, Table } from "reactstrap"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

const columnHelper = createColumnHelper<types.ContentFilter>()

const Cell = ({ getValue, row, column, table }) => {
    const cellValue = getValue()
    const columnMeta = column.columnDef.meta
    const [value, setValue] = useState(cellValue)

    const isContextCell = column.columnDef.accessorKey === "context"
    const isDefaultContextCell = isContextCell && row.original.filterType === "default"

    useEffect(() => {
        if (cellValue !== value) {
            setValue(cellValue)
        }
    }, [cellValue])

    const onChangeHandler = (e) => {
        setValue(e.target.value)
        table.options.meta.updateData(row.index, column.id, e.target.value)
    }

    if (columnMeta.element === "input") {
        return (
            <InputGroup key={`row-${row.index}-col-${column.id}-ig`}>
                {isContextCell && !isDefaultContextCell ? (
                    <span className={"input-group-text"} key={`row-${row.index}-col-${column.id}-span`}>
                        /r/
                    </span>
                ) : null}
                <Input
                    disabled={isDefaultContextCell}
                    key={`row-${row.index}-col-${column.id}-input`}
                    onChange={onChangeHandler}
                    readOnly={isDefaultContextCell}
                    step={columnMeta.step ? columnMeta.step : null}
                    title={value}
                    type={columnMeta.type}
                    value={value}
                />
            </InputGroup>
        )
    } else {
        console.error(`Unhandled column meta element: ${columnMeta.element}`)
    }
}

const ActionCell = ({ row, table }) => {
    const removeRow = () => {
        table.options.meta.removeRow(row.index)
    }

    if (row.original.filterType !== "default") {
        return (
            <Button color={"danger"} key={`row-${row.index}-action`} onClick={removeRow} name="remove" title={"Delete"}>
                <Trash key={`row-${row.index}-icon`} />
            </Button>
        )
    }
}

const HeaderCell = ({ name, storageKey, table }) => {
    const [isChecked, setIsChecked] = useStorage({ instance: storage.extLocalStorage, key: storageKey }, (v: boolean) => (v === undefined ? false : v))

    const onChangeHandler = async (e) => {
        await setIsChecked(e.target.checked)
    }

    if (table.options.meta.headerControlsVisible) {
        return (
            <span>
                {name}{" "}
                <Input
                    checked={isChecked}
                    onChange={onChangeHandler}
                    title={`${name} content filter is ${isChecked ? "enabled" : "disabled"}`}
                    type={"checkbox"}
                />
            </span>
        )
    }
    return name
}

const FooterCell = ({ table }) => {
    return (
        <div className={"d-flex justify-content-center"}>
            <Button color={"success"} onClick={table.options.meta.addRow} title={"Add new row"}>
                Add New <Plus />
            </Button>
        </div>
    )
}

const columns = [
    columnHelper.accessor("context", {
        header: "Context",
        cell: Cell,
        meta: {
            element: "input",
            type: "text"
        }
    }),
    columnHelper.accessor("age", {
        header: ({ table }) => <HeaderCell name={"Age"} storageKey={constants.AGE_CONTENT_FILTER_ENABLED} table={table} />,
        cell: Cell,
        meta: {
            element: "input",
            type: "number"
        }
    }),
    columnHelper.accessor("iq", {
        header: ({ table }) => <HeaderCell name={"IQ"} storageKey={constants.IQ_CONTENT_FILTER_ENABLED} table={table} />,
        cell: Cell,
        meta: {
            element: "input",
            type: "number"
        }
    }),
    columnHelper.accessor("sentimentPolarity", {
        header: ({ table }) => <HeaderCell name={"Polarity"} storageKey={constants.SENTIMENT_POLARITY_CONTENT_FILTER_ENABLED} table={table} />,
        cell: Cell,
        meta: {
            element: "input",
            type: "number",
            step: "0.001"
        }
    }),
    columnHelper.accessor("sentimentSubjectivity", {
        header: ({ table }) => (
            <HeaderCell name={"Subjectivity"} storageKey={constants.SENTIMENT_SUBJECTIVITY_CONTENT_FILTER_ENABLED} table={table} />
        ),
        cell: Cell,
        meta: {
            element: "input",
            type: "number",
            step: "0.001"
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
    const [data, setData] = useStorage<types.ContentFilter[]>(
        { instance: storage.extLocalStorage, key: constants.CONTENT_FILTERS },
        (v: types.ContentFilter[]) => (v === undefined ? ([] as types.ContentFilter[]) : v)
    )

    const [defaultFilter] = useStorage<types.ContentFilter>(
        { instance: storage.extLocalStorage, key: constants.DEFAULT_FILTER },
        (v) => (v === undefined ? ({} as types.ContentFilter) : v)
    )

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        initialState: {
            columnFilters: columnFilters
        },
        meta: {
            addRow: async () => {
                const newContentFilter: types.ContentFilter = {
                    age: defaultFilter.age,
                    context: "",
                    filterType: "custom",
                    iq: defaultFilter.iq,
                    sentimentPolarity: defaultFilter.sentimentPolarity,
                    sentimentSubjectivity: defaultFilter.sentimentSubjectivity
                }
                await setData([...data, newContentFilter])
            },
            headerControlsVisible: headerControlsVisible,
            removeRow: async (rowIndex: number) => {
                data.splice(rowIndex, 1)
                await setData([...data])
            },
            updateData: async (rowIndex: number, columnId: string, value: string) => {
                data[rowIndex][columnId] = value
                await setData([...data])
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
