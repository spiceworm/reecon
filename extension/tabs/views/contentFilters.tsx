import * as bases from "~tabs/bases"
import { CommentFilterTable, ThreadFilterTable } from "~util/components/filterTable/tables"

export const ContentFilters = () => {
    return (
        <bases.Authenticated>
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
        </bases.Authenticated>
    )
}
