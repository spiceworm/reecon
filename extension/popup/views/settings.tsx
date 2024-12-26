import { Button, Form, Input, Label } from "reactstrap"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as bases from "~popup/bases"
import { CommentFilterTable, ThreadFilterTable } from "~util/components/filterTable/tables"
import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const Settings = () => {
    const [activeCommentFilter] = useStorage<types.CommentFilter>({ instance: storage.extLocalStorage, key: constants.ACTIVE_COMMENT_FILTER }, (v) =>
        v === undefined ? constants.defaultCommentFilter : v
    )
    const [activeThreadFilter] = useStorage<types.ThreadFilter>({ instance: storage.extLocalStorage, key: constants.ACTIVE_THREAD_FILTER }, (v) =>
        v === undefined ? constants.defaultThreadFilter : v
    )
    const [disableExtension, setDisableExtension] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.DISABLE_EXTENSION },
        (v) => (v === undefined ? false : v)
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
            </Form>

            <ThreadFilterTable
                columnFilters={[
                    {
                        id: "context",
                        value: activeThreadFilter.context
                    }
                ]}
                columnVisibility={{
                    context: true,
                    sentimentPolarity: true,
                    sentimentSubjectivity: true,
                    action: false
                }}
                footerVisible={false}
                headerControlsVisible={true}
            />
            <CommentFilterTable
                columnFilters={[
                    {
                        id: "context",
                        value: activeCommentFilter.context
                    }
                ]}
                columnVisibility={{
                    context: true,
                    age: true,
                    iq: true,
                    sentimentPolarity: true,
                    sentimentSubjectivity: true,
                    action: false
                }}
                footerVisible={false}
                headerControlsVisible={true}
            />

            <div className={"d-flex justify-content-center"}>
                <Button color={"primary"} onClick={handleAllSettingsBtnClick} type={"button"}>
                    More
                </Button>
            </div>
        </bases.Authenticated>
    )
}
