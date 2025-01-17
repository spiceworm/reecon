import Stack from "@mui/material/Stack"

import * as navigation from "~tabs/navigation"
import * as bases from "~util/components/bases"
import { CommentFilterTable, ThreadFilterTable } from "~util/components/filterTable/tables"

export const ContentFiltersView = () => {
    return (
        <bases.Base>
            <Stack>
                <navigation.TabsNavigation />

                <Stack spacing={2}>
                    <ThreadFilterTable
                        columnFilters={[]}
                        columnVisibility={{
                            context: true,
                            sentimentPolarity: true,
                            sentimentSubjectivity: true,
                            action: true
                        }}
                        footerVisible={true}
                        headerControlsVisible={false}
                    />
                    <CommentFilterTable
                        columnFilters={[]}
                        columnVisibility={{
                            context: true,
                            age: true,
                            iq: true,
                            sentimentPolarity: true,
                            sentimentSubjectivity: true,
                            action: true
                        }}
                        footerVisible={true}
                        headerControlsVisible={false}
                    />
                </Stack>
            </Stack>
        </bases.Base>
    )
}
