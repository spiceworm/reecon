import {useStorage} from "@plasmohq/storage/dist/hook"
import {Button, Form, Input, Label} from "reactstrap"

import * as base from "~popup/bases"
import * as storage from "~util/storage"
import type * as types from "~util/types"
import {ContentFilterTable} from "~util/components/contentFilterTable"


export const Settings = () => {
    const [activeContentFilter, _] = useStorage(
        {instance: storage.instance, key: storage.ACTIVE_CONTENT_FILTER},
        (v: types.ContentFilter) => v === undefined ? storage.defaultContentFilter : v,
    )
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

    const handleAllSettingsBtnClick = async (e) => {
        await chrome.tabs.create({url: "/tabs/index.html"})
    }

    // FIXME: when the current context settings table loads in the popup, the context name input should be
    //   read-only for all contexts. It is currently only read-only when the Default context loads because
    //   it is always read only. I'm starting to think that the tanstack table shown in the popup should
    //   not be shown in the popup and all context settings shows should just be read only inputs.

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
                    value: activeContentFilter.context
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
