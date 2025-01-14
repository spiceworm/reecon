import * as navigation from "~tabs/navigation"
import { CheckStorageSize } from "~util/components/debugTools"

export const DebugView = () => {
    return (
        <navigation.TabsNavigation>
            <CheckStorageSize />
        </navigation.TabsNavigation>
    )
}
