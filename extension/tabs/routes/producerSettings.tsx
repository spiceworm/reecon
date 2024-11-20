import * as bases from "~tabs/bases"
import { ProducerSettingsInputs } from "~util/components/producerSettings"

export const ProducerSettings = () => {
    return (
        <bases.Authenticated>
            <h2 className={"pb-3"}>Producer Settings</h2>
            <ProducerSettingsInputs />
        </bases.Authenticated>
    )
}
