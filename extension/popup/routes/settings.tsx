import * as react from "react"
import {useStorage} from "@plasmohq/storage/dist/hook"
import {Button, Form, Input, Label} from "reactstrap"

import * as base from "~popup/bases"
import * as storage from "~util/storage"
import {ContentFilterTable} from "~util/components/contentFilterTable"


export const Settings = () => {
    const [disableExtension, setDisableExtension] = useStorage(
        {instance: storage.instance, key: storage.DISABLE_EXTENSION},
        (v: boolean) => v === undefined ? false : v,
    )
    const [hideBadSentimentThreads, setHideBadSentimentThreads] = useStorage(
        {instance: storage.instance, key: storage.HIDE_BAD_SENTIMENT_THREADS},
        (v: boolean) => v === undefined ? false : v,
    )
    const [hideIgnoredRedditors, setHideIgnoredRedditors] = useStorage(
        {instance: storage.instance, key: storage.HIDE_IGNORED_REDDITORS},
        (v: boolean) => v === undefined ? false : v,
    )
    const [currentContext, setCurrentContext] = react.useState('default')

    const handleAllSettingsBtnClick = async (e) => {
        await chrome.tabs.create({url: "/tabs/index.html"})
    }

    storage.getContentFilter().then(contentFilter => {
        setCurrentContext(contentFilter.context)
    })

    return (
        <base.Authenticated>
            <Form>
                <div className={"form-check pt-2"}>
                    <Input
                        className={"form-check-input"}
                        checked={disableExtension}
                        onChange={(e) => setDisableExtension(e.target.checked)}
                        type="checkbox"
                    />
                    <Label for={"disableExtension"}>Disable reecon</Label>
                </div>
                <div className={"form-check"}>
                    <Input
                        className={"form-check-input"}
                        checked={hideBadSentimentThreads}
                        onChange={(e) => setHideBadSentimentThreads(e.target.checked)}
                        type="checkbox"
                    />
                    <Label for={"hideBadSentimentThreads"}>Hide threads with bad sentiment</Label>
                </div>
                <div className={"form-check"}>
                    <Input
                        className={"form-check-input"}
                        checked={hideIgnoredRedditors}
                        onChange={(e) => setHideIgnoredRedditors(e.target.checked)}
                        type="checkbox"
                    />
                    <Label for={"hideIgnoredRedditors"}>Hide comments from ignored redditors</Label>
                </div>
            </Form>

            <ContentFilterTable
                columnFilters={[{
                    id: 'context',
                    value: currentContext
                }]}
                columnVisibility={{
                    context: true,
                    age: true,
                    iq: true,
                    sentiment: true,
                    action: false,
                }}
                footerVisible={false}
            />

            <div className={"d-flex justify-content-center"}>
                <Button color={"primary"} onClick={handleAllSettingsBtnClick} type={"button"}>All Settings</Button>
            </div>
        </base.Authenticated>
    )
}
