import * as bases from "~tabs/bases"
import { ProducerSettingsInputs } from "~util/components/producerSettings"

export const ProducerSettings = () => {
    return (
        <bases.Authenticated>
            <ProducerSettingsInputs />
        </bases.Authenticated>
    )
}
