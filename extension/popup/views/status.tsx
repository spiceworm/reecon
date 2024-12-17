import { Alert, Toast, ToastBody, ToastHeader } from "reactstrap"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as bases from "~popup/bases"
import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const Status = () => {
    const [statusMessages] = useStorage(
        { instance: storage.extLocalStorage, key: constants.STATUS_MESSAGES },
        (v: (types.ApiStatusMessage | types.ExtensionStatusMessage)[]) => (v === undefined ? [] : v)
    )

    const activeStatusMessage = statusMessages.filter((message: types.ApiStatusMessage | types.ExtensionStatusMessage) => message.active)

    return (
        <bases.Authenticated>
            {activeStatusMessage.length === 0 ? (
                <Alert color={"light"}>No status messages</Alert>
            ) : (
                activeStatusMessage.map((message, idx: number) => (
                    <div className={"p-1"}>
                        <Toast key={`status-message-${idx}`}>
                            <ToastHeader icon={message.category}>Source: {message.source}</ToastHeader>
                            <ToastBody>{message.message}</ToastBody>
                        </Toast>
                    </div>
                ))
            )}
        </bases.Authenticated>
    )
}
