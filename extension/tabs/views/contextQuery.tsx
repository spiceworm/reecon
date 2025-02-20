import Divider from "@mui/material/Divider"
import Stack from "@mui/material/Stack"

import * as navigation from "~tabs/navigation"
import * as bases from "~util/components/bases"
import { ContextQueryForm } from "~util/components/contextQueryForm"
import { ContextQueryHistory } from "~util/components/contextQueryHistory"

export const ContextQueryView = () => {
    return (
        <bases.Base>
            <Stack>
                <navigation.TabsNavigation />

                <Stack m={2} spacing={2}>
                    <ContextQueryForm />
                    <Divider />
                    <ContextQueryHistory />
                </Stack>
            </Stack>
        </bases.Base>
    )
}
