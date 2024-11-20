import * as bases from "~tabs/bases"
import { ContextQueryForm } from "~util/components/contextQueryForm"

export const ContextQuery = () => {
    return (
        <bases.Authenticated>
            <h2 className={"pb-3"}>Context Query</h2>
            <ContextQueryForm />
        </bases.Authenticated>
    )
}
