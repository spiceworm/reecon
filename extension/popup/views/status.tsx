import CheckIcon from "@mui/icons-material/Check"
import Alert from "@mui/material/Alert"
import Stack from "@mui/material/Stack"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as navigation from "~popup/navigation"
import * as bases from "~util/components/bases"
import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type { ApiStatusMessage } from "~util/types/backend/reecon/modelSerializers"
import type { ExtensionStatusMessage } from "~util/types/extension/types"

export const StatusView = () => {
    const [statusMessages] = useStorage(
        { instance: storage.extLocalStorage, key: constants.ALL_STATUS_MESSAGES },
        (v: (ApiStatusMessage | ExtensionStatusMessage)[]) => (v === undefined ? [] : v)
    )

    const activeStatusMessage = statusMessages.filter((message: ApiStatusMessage | ExtensionStatusMessage) => message.active)

    return (
        <bases.Base>
            <Stack>
                <navigation.PopupNavigation />

                <Stack m={2} spacing={2}>
                    {activeStatusMessage.length === 0 ? (
                        <Alert icon={<CheckIcon />} severity={"success"} variant={"outlined"}>
                            No status messages
                        </Alert>
                    ) : (
                        <>
                            {activeStatusMessage.map((message, idx: number) => (
                                <Alert key={`status-message-${idx}`} severity={message.category} variant={"outlined"}>
                                    <Tooltip title={`Status message source: ${message.source}`}>
                                        <Typography>{message.message}</Typography>
                                    </Tooltip>
                                </Alert>
                            ))}
                        </>
                    )}
                </Stack>
            </Stack>
        </bases.Base>
    )
}
