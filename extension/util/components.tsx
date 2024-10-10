import 'bootstrap/dist/css/bootstrap.min.css'
import {useEffect, useState} from 'react'
import {useStorage} from "@plasmohq/storage/dist/hook"
import {Button, Input, InputGroup, Table} from "reactstrap"
import {Plus, Trash} from 'react-bootstrap-icons'

// https://muhimasri.com/blogs/react-editable-table/
// https://muhimasri.com/blogs/add-remove-react-table-rows/
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable
} from '@tanstack/react-table'

import type * as types from "~util/types"


const columnHelper = createColumnHelper<types.ContentFilter>()


const Cell = ({getValue, row, column, table}) => {
    const cellValue = getValue()
    const columnMeta = column.columnDef.meta;
    const [value, setValue] = useState(cellValue)

    const isSpecialCell = column.columnDef.accessorKey === "context" && row.original.filterType === "default"

    useEffect(() => {
        setValue(cellValue)
    }, [cellValue])

    const onBlur = () => {
        table.options.meta.updateData(row.index, column.id, value)
    }

    const onChange = (e) => {
        setValue(e.target.value)
    }

    if (columnMeta.element === "input") {
        return (
            <InputGroup key={`row-${row.index}-col-${column.id}-ig`}>
                {
                    column.columnDef.accessorKey === "context" && !isSpecialCell
                        ? <span className={"input-group-text"} key={`row-${row.index}-col-${column.id}-span`}>/r/</span>
                        : null
                }
                <Input
                    disabled={isSpecialCell}
                    key={`row-${row.index}-col-${column.id}-input`}
                    onBlur={onBlur}
                    onChange={onChange}
                    readOnly={isSpecialCell}
                    step={columnMeta.step ? columnMeta.step : null}
                    type={columnMeta.type}
                    value={value}
                />
            </InputGroup>
        )
    } else {
        console.error(`Unhandled column meta element: ${columnMeta.element}`)
    }
}


const ActionCell = ({row, table}) => {
    const removeRow = () => {
        table.options.meta.removeRow(row.index);
    };

    if (row.original.filterType !== 'default') {
        return (
            <Button color={"danger"} key={`row-${row.index}-action`} onClick={removeRow} name="remove" title={"Delete"}>
                <Trash key={`row-${row.index}-icon`}/>
            </Button>
        )
    }
}


const FooterCell = ({table}) => {
    return (
        <div className={"d-flex justify-content-end"}>
            <Button color={"success"} onClick={table.options.meta.addRow} title={"Add new row"}>
                Add New <Plus/>
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
            type: "text",
        },
    }),
    columnHelper.accessor("age", {
        header: "Age",
        cell: Cell,
        meta: {
            element: "input",
            type: "number",
        },
    }),
    columnHelper.accessor("iq", {
        header: "IQ",
        cell: Cell,
        meta: {
            element: "input",
            type: "number",
        },
    }),
    columnHelper.accessor("sentiment", {
        header: "Sentiment",
        cell: Cell,
        meta: {
            element: "input",
            type: "number",
            step: "0.001",
        },
    }),
    columnHelper.display({
        id: "action",
        cell: ActionCell,
    })
];


const defaultColumnVisibility = {
    context: true,
    age: true,
    iq: true,
    sentiment: true,
    action: true,
}


export const ContentFilterTable = (
    {columnVisibility = defaultColumnVisibility, columnFilters = [], footerVisible = true}
) => {

    const [data, setData] = useStorage<types.ContentFilter[]>(
        'contentFilters', (cfArray) => cfArray === undefined ? [] as types.ContentFilter[] : cfArray
    )
    const [defaultFilter, setDefaultFilter] = useStorage<types.ContentFilter>(
        'defaultFilter', (cf) => cf === undefined ? {} as types.ContentFilter : cf
    )

    console.log([...columnFilters])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        initialState: {
            columnFilters: columnFilters,
        },
        meta: {
            addRow: () => {
                const newContentFilter: types.ContentFilter = {
                    age: defaultFilter.age,
                    context: "",
                    filterType: "custom",
                    iq: defaultFilter.iq,
                    sentiment: defaultFilter.sentiment,
                };
                setData([...data, newContentFilter]).then()
            },
            removeRow: (rowIndex: number) => {
                data.splice(rowIndex, 1)
                setData([...data]).then()
            },
            updateData: (rowIndex: number, columnId: string, value: string) => {
                if (rowIndex === 0) {
                    defaultFilter[columnId] = value
                    setDefaultFilter(defaultFilter).then()
                }

                data[rowIndex][columnId] = value
                setData([...data]).then()
            },
        },
        state: {
            columnFilters,
            columnVisibility,
        }
    });

    return (
        <Table>
            <thead>
            {
                table.getHeaderGroups().map((headerGroup) => {
                    return (
                        <tr key={`tr-${headerGroup.id}`}>
                            {headerGroup.headers.map((header, idx) => {
                                return (
                                    <th key={`tr-${headerGroup.id}-th-${header.id}-${idx}`}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                );
                            })}
                        </tr>
                    );
                })
            }
            </thead>
            <tbody>
            {
                table.getRowModel().rows.map((row) => {
                    return (
                        <tr key={`tr-${row.id}`}>
                            {row.getVisibleCells().map((cell) => {
                                return (
                                    <td key={`tr-${row.id}-td-${cell.id}`}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })
            }
            </tbody>
            <tfoot>
            {
                footerVisible ? <tr key={"tr-footer"}>
                    <th colSpan={table.getCenterLeafColumns().length}>
                        <FooterCell table={table}/>
                    </th>
                </tr> : null
            }
            </tfoot>
        </Table>
    );
}
