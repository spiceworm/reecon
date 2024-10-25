import {useStorage} from "@plasmohq/storage/dist/hook"
import useSWR from "swr"
import {Button, Form, Input, Label, Spinner} from "reactstrap"
import {Navigate} from "react-router-dom"
import {useState} from "react"

import * as api from "~util/api"
import * as base from "~popup/bases"
import * as storage from "~util/storage"
import {ContentFilterTable} from "~util/components/contentFilterTable"


export const Settings = () => {
    const [disableExtension, setDisableExtension] = useStorage("disableExtension", (v) => v === undefined ? false : v)
    const [hideBadSentimentThreads, setHideBadSentimentThreads] = useStorage("hideBadSentimentThreads", (v) => v === undefined ? false : v)
    const [hideIgnoredRedditors, setHideIgnoredRedditors] = useStorage("hideIgnoredRedditors", (v) => v === undefined ? false : v)
    const [currentContext, setCurrentContext] = useState('default')
    const {data: accessToken, error, isLoading} = useSWR('/api/v1/auth/token/refresh/', api.ensureAccessToken)

    if (isLoading) {
        return <Spinner/>
    }
    if (error) {
        return <p>{error.message}</p>
    }
    if (accessToken === null) {
        return <Navigate to="/auth/login" replace={true}/>
    }

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
                        id="disableExtension"
                        onChange={(e) => setDisableExtension(e.target.checked)}
                        type="checkbox"
                    />
                    <Label for={"disableExtension"}>Disable reecon</Label>
                </div>
                <div className={"form-check"}>
                    <Input
                        className={"form-check-input"}
                        checked={hideBadSentimentThreads}
                        id="hideBadSentimentThreads"
                        onChange={(e) => setHideBadSentimentThreads(e.target.checked)}
                        type="checkbox"
                    />
                    <Label for={"hideBadSentimentThreads"}>Hide threads with bad sentiment</Label>
                </div>
                <div className={"form-check"}>
                    <Input
                        className={"form-check-input"}
                        checked={hideIgnoredRedditors}
                        id="hideIgnoredRedditors"
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
