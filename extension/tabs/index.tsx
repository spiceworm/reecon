import {ProducerSettingsInputs} from "~util/components/producerSettings"
import {ContentFilterTable} from "~util/components/contentFilterTable"


export default function OptionsPage() {
    return (
        <div className={"p-3"}>
            <h2 className={"pb-3"}>API Providers</h2>
            <ProducerSettingsInputs/>

            <h2 className={"pt-3"}>Content Filters</h2>
            <ContentFilterTable/>
        </div>
    )
}
