import * as bases from "~tabs/bases"
import { ContentFilterTable } from "~util/components/contentFilterTable"

export const ContentFilters = () => {
    return (
        <bases.Authenticated>
            <h2 className={"pb-3"}>API Providers</h2>
            <ContentFilterTable />
        </bases.Authenticated>
    )
}
