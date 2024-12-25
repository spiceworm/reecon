import * as bases from "~tabs/bases"
import { CheckStorageSize } from "~util/components/debugTools"

export const Debug = () => {
    return (
        <bases.Authenticated>
            <CheckStorageSize />
        </bases.Authenticated>
    )
}
