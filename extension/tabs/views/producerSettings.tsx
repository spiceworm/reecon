import * as navigation from "~tabs/navigation"
import { ProducerSettingsInputs } from "~util/components/producerSettings"

export const ProducerSettingsView = () => {
    return (
        <navigation.TabsNavigation>
            <ProducerSettingsInputs />
        </navigation.TabsNavigation>
    )
}
