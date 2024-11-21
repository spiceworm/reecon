import * as bases from "~tabs/bases"
import { ContentFilterTable } from "~util/components/contentFilterTable"

export const ContentFilters = () => {
    return (
        <bases.Authenticated>
            <ContentFilterTable />
        </bases.Authenticated>
    )
}
