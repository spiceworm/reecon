import Stack from "@mui/material/Stack"

import * as navigation from "~tabs/navigation"
import * as bases from "~util/components/bases"
import { LlmProvidersSettingsInputs } from "~util/components/llmProvidersSettings"

export const LlmProvidersSettingsView = () => {
    return (
        <bases.Base>
            <Stack>
                <navigation.TabsNavigation />

                <Stack m={2} spacing={2}>
                    <LlmProvidersSettingsInputs />
                </Stack>
            </Stack>
        </bases.Base>
    )
}
