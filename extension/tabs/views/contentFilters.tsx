import * as navigation from "~tabs/navigation"
import { CommentFilterTable, ThreadFilterTable } from "~util/components/filterTable/tables"

export const ContentFiltersView = () => {
    return (
        <navigation.TabsNavigation>
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
        </navigation.TabsNavigation>
    )
}
