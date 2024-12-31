import { useEffect, useState } from "react"
import { Check, Pencil, Plus, Trash } from "react-bootstrap-icons"
import { Button, ButtonGroup, Input, InputGroup } from "reactstrap"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as storage from "~util/storage"

export const Cell = ({ getValue, row, column, table }) => {
    const initialValue = getValue()
    const columnMeta = column.columnDef.meta
    const tableMeta = table.options.meta
    const rowUUID = row.original.uuid

    const [renderValue, setRenderValue] = useState(initialValue)

    const isContextCell = column.columnDef.id === "context"
    const isDefaultContextCell = isContextCell && row.original.filterType === "default"

    useEffect(() => {
        // When a new row is added, validate the new row values so a validation error is triggered for the empty context field.
        tableMeta.validateCell(initialValue, columnMeta, column.id, rowUUID)

        if (initialValue !== renderValue) {
            setRenderValue(initialValue)
        }
    }, [initialValue])

    const onChangeHandler = (e): void => {
        let value = e.target.value

        if (tableMeta.validateCell(value, columnMeta, column.id, rowUUID)) {
            value = columnMeta.cast(value)
        }

        setRenderValue(value)
        tableMeta.updateRenderedData(rowUUID, column.id, value)
    }

    const validationError = tableMeta.getCellValidationError(rowUUID, column.id)

    if (columnMeta.element === "input") {
        return (
            <InputGroup key={`row-${row.index}-col-${column.id}-ig`}>
                {isContextCell && !isDefaultContextCell ? (
                    <span className={"input-group-text"} key={`row-${row.index}-col-${column.id}-span`}>
                        /r/
                    </span>
                ) : null}
                <Input
                    disabled={isDefaultContextCell || !tableMeta.rowIsEditable(rowUUID)}
                    invalid={validationError.length > 0}
                    key={`row-${row.index}-col-${column.id}-input`}
                    onChange={onChangeHandler}
                    readOnly={isDefaultContextCell || !tableMeta.rowIsEditable(rowUUID)}
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
    const rowUUID = row.original.uuid

    const onDeleteClickHandler = (): void => {
        tableMeta.removeRow(rowUUID)
    }

    const onEditClickHandler = (): void => {
        tableMeta.resetRowValidationErrors(rowUUID)
        tableMeta.setRowEditingState(rowUUID, true)
    }

    const onSaveClickHandler = async (): Promise<void> => {
        if (!tableMeta.rowHasValidationErrors(rowUUID)) {
            await tableMeta.updateStorageRow(rowUUID)
            tableMeta.setRowEditingState(rowUUID, false)
        }
    }

    return (
        <ButtonGroup>
            <>
                {tableMeta.rowIsEditable(rowUUID) ? (
                    <Button color={"success"} disabled={tableMeta.rowHasValidationErrors(rowUUID)} onClick={onSaveClickHandler}>
                        <Check />
                    </Button>
                ) : (
                    <Button color={"secondary"} onClick={onEditClickHandler}>
                        <Pencil />
                    </Button>
                )}
                {row.original.filterType !== "default" ? (
                    <Button
                        color={"danger"}
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
        const rowUUID = tableMeta.addRow()
        tableMeta.resetRowValidationErrors(rowUUID)
        tableMeta.setRowEditingState(rowUUID, true)
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
