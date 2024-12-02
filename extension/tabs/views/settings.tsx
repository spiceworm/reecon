import * as bases from "~tabs/bases"
import { ProducerSettingsInputs } from "~util/components/settings"

export const Settings = () => {
    return (
        <bases.Authenticated>
            <ProducerSettingsInputs />
        </bases.Authenticated>
    )
}
