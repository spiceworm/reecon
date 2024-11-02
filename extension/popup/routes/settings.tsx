import {useStorage} from "@plasmohq/storage/dist/hook"
import {Button, Form, Input, Label, Table} from "reactstrap"

import * as base from "~popup/bases"
import * as storage from "~util/storage"
import type * as types from "~util/types"


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

            <Table bordered>
                <thead>
                <tr>
                    <th>Context</th>
                    <th>Age</th>
                    <th>IQ</th>
                    <th>Sentiment</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <th scope={"row"}>
                        {activeContentFilter.context}
                    </th>
                    <td>
                        {activeContentFilter.age}
                    </td>
                    <td>
                        {activeContentFilter.iq}
                    </td>
                    <td>
                        {activeContentFilter.sentiment}
                    </td>
                </tr>
                </tbody>
            </Table>

            <div className={"d-flex justify-content-center"}>
            <Button color={"primary"} onClick={handleAllSettingsBtnClick} type={"button"}>All Settings</Button>
            </div>
        </base.Authenticated>
    )
}
