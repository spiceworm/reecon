import * as bases from "~tabs/bases"
import { ContextQueryForm } from "~util/components/contextQueryForm"
import { ContextQueryHistory } from "~util/components/contextQueryHistory"

export const ContextQuery = () => {
    return (
        <bases.Authenticated>
            <ContextQueryForm />
            <ContextQueryHistory />
        </bases.Authenticated>
    )
}
