import * as navigation from "~tabs/navigation"
import { ContextQueryForm } from "~util/components/contextQueryForm"
import { ContextQueryHistory } from "~util/components/contextQueryHistory"

export const ContextQueryView = () => {
    return (
        <navigation.TabsNavigation>
            <ContextQueryForm />
            <ContextQueryHistory />
        </navigation.TabsNavigation>
    )
}
