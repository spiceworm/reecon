import { Alert, Toast, ToastBody, ToastHeader } from "reactstrap"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as navigation from "~popup/navigation"
import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const StatusView = () => {
    const [statusMessages] = useStorage(
        { instance: storage.extLocalStorage, key: constants.ALL_STATUS_MESSAGES },
        (v: (types.ApiStatusMessage | types.ExtensionStatusMessage)[]) => (v === undefined ? [] : v)
    )

    const activeStatusMessage = statusMessages.filter((message: types.ApiStatusMessage | types.ExtensionStatusMessage) => message.active)

    return (
        <navigation.PopupNavigation>
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
        </navigation.PopupNavigation>
    )
}
