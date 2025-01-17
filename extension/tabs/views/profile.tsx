import Stack from "@mui/material/Stack"

import * as navigation from "~tabs/navigation"
import * as bases from "~util/components/bases"
import { ProfileData } from "~util/components/profile"

export const ProfileView = () => {
    return (
        <bases.Base>
            <Stack>
                <navigation.TabsNavigation />

                <Stack spacing={2}>
                    <ProfileData />
                </Stack>
            </Stack>
        </bases.Base>
    )
}
