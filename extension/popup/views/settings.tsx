import { Button, Form, Input, Label } from "reactstrap"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as bases from "~popup/bases"
import { ContentFilterTable } from "~util/components/contentFilterTable"
import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const Settings = () => {
    const [activeContentFilter] = useStorage({ instance: storage.localStorage, key: constants.ACTIVE_CONTENT_FILTER }, (v: types.ContentFilter) =>
        v === undefined ? constants.defaultContentFilter : v
    )
    const [disableExtension, setDisableExtension] = useStorage({ instance: storage.localStorage, key: constants.DISABLE_EXTENSION }, (v: boolean) =>
        v === undefined ? false : v
    )
    const [hideBadSentimentThreads, setHideBadSentimentThreads] = useStorage(
        {
            instance: storage.localStorage,
            key: constants.HIDE_BAD_SENTIMENT_THREADS
        },
        (v: boolean) => (v === undefined ? false : v)
    )

    const handleAllSettingsBtnClick = async (e) => {
        await chrome.tabs.create({ url: "/tabs/index.html" })
    }

    return (
        <bases.Authenticated>
            <Form>
                <div className={"form-check pt-2"}>
                    <Input
                        className={"form-check-input"}
                        checked={disableExtension}
                        id={"disableExtension"}
                        onChange={(e) => setDisableExtension(e.target.checked)}
                        type="checkbox"
                    />
                    <Label for={"disableExtension"}>Disable reecon</Label>
                </div>
                <div className={"form-check"}>
                    <Input
                        className={"form-check-input"}
                        checked={hideBadSentimentThreads}
                        id={"hideBadSentimentThreads"}
                        onChange={(e) => setHideBadSentimentThreads(e.target.checked)}
                        type="checkbox"
                    />
                    <Label for={"hideBadSentimentThreads"}>Hide threads with bad sentiment</Label>
                </div>
            </Form>

            <ContentFilterTable
                columnFilters={[
                    {
                        id: "context",
                        value: activeContentFilter.context
                    }
                ]}
                columnVisibility={{
                    context: true,
                    age: true,
                    iq: true,
                    sentiment: true,
                    action: false
                }}
                footerVisible={false}
            />

            <div className={"d-flex justify-content-center"}>
                <Button color={"primary"} onClick={handleAllSettingsBtnClick} type={"button"}>
                    More
                </Button>
            </div>
        </bases.Authenticated>
    )
}
