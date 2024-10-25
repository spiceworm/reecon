import {ContentFilterTable} from "~util/components/contentFilterTable"


export default function OptionsPage() {
    return (
        <div className={"p-3"}>
            <h2 className={"pt-3"}>Content Filters</h2>
            <ContentFilterTable/>
        </div>
    )
}
