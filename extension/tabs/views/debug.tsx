import Stack from "@mui/material/Stack"

import * as navigation from "~tabs/navigation"
import * as bases from "~util/components/bases"
import { CheckStorageSize } from "~util/components/debugTools"

export const DebugView = () => {
    return (
        <bases.Base>
            <Stack>
                <navigation.TabsNavigation />

                <Stack spacing={2}>
                    <CheckStorageSize />
                </Stack>
            </Stack>
        </bases.Base>
    )
}
