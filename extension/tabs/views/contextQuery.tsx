import * as bases from "~tabs/bases"
import { ContextQueryForm } from "~util/components/contextQueryForm"

export const ContextQuery = () => {
    return (
        <bases.Authenticated>
            <ContextQueryForm />
        </bases.Authenticated>
    )
}
