import CheckIcon from "@mui/icons-material/Check"
import Alert from "@mui/material/Alert"
import AlertTitle from "@mui/material/AlertTitle"
import Stack from "@mui/material/Stack"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as navigation from "~popup/navigation"
import * as bases from "~util/components/bases"
import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const StatusView = () => {
    const [statusMessages] = useStorage(
        { instance: storage.extLocalStorage, key: constants.ALL_STATUS_MESSAGES },
        (v: (types.ApiStatusMessage | types.ExtensionStatusMessage)[]) => (v === undefined ? [] : v)
    )

    const activeStatusMessage = statusMessages.filter((message: types.ApiStatusMessage | types.ExtensionStatusMessage) => message.active)

    // {/* FIXME: update message categories of `message.category` attribute to match MUI color categories. (current using bootstraps color categories) */}

    return (
        <bases.Base>
            <Stack>
                <navigation.PopupNavigation />

                {activeStatusMessage.length === 0 ? (
                    <Alert icon={<CheckIcon />} severity={"success"}>
                        No status messages
                    </Alert>
                ) : (
                    <Stack>
                        {activeStatusMessage.map((message, idx: number) => (
                            <Alert key={`status-message-${idx}`} severity={"info"}>
                                <AlertTitle>{message.source}</AlertTitle>
                                {message.message}
                            </Alert>
                        ))}
                    </Stack>
                )}
            </Stack>
        </bases.Base>
    )
}
