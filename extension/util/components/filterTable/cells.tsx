import { useEffect, useState } from "react"
import { Check, Pencil, Plus, Trash } from "react-bootstrap-icons"
import { Button, ButtonGroup, Input, InputGroup } from "reactstrap"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as storage from "~util/storage"

export const Cell = ({ getValue, row, column, table }) => {
    const initialValue = getValue()
    const columnMeta = column.columnDef.meta
    const tableMeta = table.options.meta

    const [renderValue, setRenderValue] = useState(initialValue)

    const isContextCell = column.columnDef.id === "context"
    const isDefaultContextCell = isContextCell && row.original.filterType === "default"

    useEffect(() => {
        // When a new row is added, validate the new row values so a validation error is triggered for the empty context field.
        tableMeta.validateCellInput(initialValue, columnMeta, column.id, row.index)

        if (initialValue !== renderValue) {
            setRenderValue(initialValue)
        }
    }, [initialValue])

    const onChangeHandler = (e): void => {
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

export const ActionCell = ({ row, table }) => {
    const tableMeta = table.options.meta

    const onDeleteClickHandler = (): void => {
        tableMeta.removeRow(row.index)
    }

    const onEditClickHandler = (): void => {
        tableMeta.resetRowValidationErrors(row.index)
        tableMeta.setRowEditingState(row.index, true)
    }

    const onSaveClickHandler = async (): Promise<void> => {
        if (!tableMeta.rowHasValidationErrors(row.index)) {
            await tableMeta.setStorageData([...tableMeta.data])
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
                {row.original.filterType !== "default" ? (
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

export const HeaderCell = ({ name, storageKey, table }) => {
    const [filterEnabled, setFilterEnabled] = useStorage<boolean>({ instance: storage.extLocalStorage, key: storageKey }, (v) =>
        v === undefined ? false : v
    )

    const onChangeHandler = async (e): Promise<void> => {
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

export const FooterCell = ({ table }) => {
    const tableMeta = table.options.meta

    const onClickHandler = (): void => {
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
