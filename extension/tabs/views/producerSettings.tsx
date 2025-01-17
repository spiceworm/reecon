import Stack from "@mui/material/Stack"

import * as navigation from "~tabs/navigation"
import * as bases from "~util/components/bases"
import { ProducerSettingsInputs } from "~util/components/producerSettings"

export const ProducerSettingsView = () => {
    return (
        <bases.Base>
            <Stack>
                <navigation.TabsNavigation />

                <Stack spacing={2}>
                    <ProducerSettingsInputs />
                </Stack>
            </Stack>
        </bases.Base>
    )
}
