import AddIcon from "@mui/icons-material/Add"
import CheckIcon from "@mui/icons-material/Check"
import DeleteIcon from "@mui/icons-material/Delete"
import EditIcon from "@mui/icons-material/Edit"
import Button from "@mui/material/Button"
import ButtonGroup from "@mui/material/ButtonGroup"
import Checkbox from "@mui/material/Checkbox"
import FormControlLabel from "@mui/material/FormControlLabel"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect, useState } from "react"

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
            <TextField
                disabled={isDefaultContextCell || !tableMeta.rowIsEditable(rowUUID)}
                error={validationError.length > 0}
                fullWidth={true}
                key={`row-${row.index}-col-${column.id}-input`}
                onChange={onChangeHandler}
                title={validationError.length > 0 ? validationError : renderValue}
                type={columnMeta.type}
                value={renderValue}
                inputProps={{
                    step: columnMeta.step ? columnMeta.step : ""
                }}
                InputProps={{
                    readOnly: isDefaultContextCell || !tableMeta.rowIsEditable(rowUUID),
                    disableUnderline: isDefaultContextCell || !tableMeta.rowIsEditable(rowUUID),
                    startAdornment: isContextCell && !isDefaultContextCell ? <InputAdornment position="start">/r/</InputAdornment> : null
                }}
            />
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
            {tableMeta.rowIsEditable(rowUUID) ? (
                <IconButton color={"success"} disabled={tableMeta.rowHasValidationErrors(rowUUID)} onClick={onSaveClickHandler}>
                    <CheckIcon />
                </IconButton>
            ) : (
                <IconButton color={"secondary"} onClick={onEditClickHandler}>
                    <EditIcon />
                </IconButton>
            )}
            {row.original.filterType !== "default" ? (
                <IconButton color={"error"} key={`row-${row.index}-action`} onClick={onDeleteClickHandler} title={"Delete"}>
                    <DeleteIcon key={`row-${row.index}-icon`} />
                </IconButton>
            ) : null}
        </ButtonGroup>
    )
}

export const ActionHeaderCell = ({ name, storageKey, table }) => {
    const [filterEnabled, setFilterEnabled] = useStorage<boolean>({ instance: storage.extLocalStorage, key: storageKey }, (v) =>
        v === undefined ? false : v
    )

    const onChangeHandler = async (e): Promise<void> => {
        await setFilterEnabled(e.target.checked)
    }

    const label = <Typography>{name}</Typography>

    if (table.options.meta.headerControlsVisible) {
        return (
            <FormControlLabel
                control={<Checkbox checked={filterEnabled} onChange={onChangeHandler} />}
                label={label}
                labelPlacement="end"
                title={`${name} content filter is ${filterEnabled ? "enabled" : "disabled"}`}
            />
        )
    }
    return label
}

export const HeaderCell = ({ name }) => {
    return <Typography>{name}</Typography>
}

export const FooterCell = ({ table }) => {
    const tableMeta = table.options.meta

    const onClickHandler = (): void => {
        const rowUUID = tableMeta.addRow()
        tableMeta.resetRowValidationErrors(rowUUID)
        tableMeta.setRowEditingState(rowUUID, true)
    }

    return (
        <Button
            color={"success"}
            disabled={tableMeta.tableHasValidationErrors() || tableMeta.rowEditingInProgress()}
            endIcon={<AddIcon />}
            onClick={onClickHandler}
            title={"Add new row"}>
            Add New
        </Button>
    )
}
