import {useStorage} from "@plasmohq/storage/dist/hook"
import useSWR from "swr"
import {Button, Form, Input, Label, Spinner} from "reactstrap"
import {Navigate} from "react-router-dom"
import {useState} from "react"

import * as api from "~util/api"
import * as base from "~popup/bases"
import * as components from "~util/components"
import * as storage from "~util/storage"
import type * as types from "~util/types";


const getCurrentContext = async () => {
    // FIXME: for some reason using `chrome.tabs` is undefined even though `browser.tabs` works as expected
    const tabs = await browser.tabs.query({currentWindow: true, active: true})
    const url = new URL(tabs[0].url)

    // this will be the subreddit name if we are viewing a sub or an empty string if viewing home
    const context: string = url.pathname.split('/r/').at(-1).split('/')[0]
    return context === '' ? 'default' : context
}


const getContentFilter = async () => {
    const context: string = await getCurrentContext()

    for (const contentFilter of await storage.storage.get('contentFilters') as types.ContentFilter[]) {
        if (contentFilter.context === context) {
            return contentFilter
        }
    }

    return await storage.storage.get('defaultFilter') as types.ContentFilter
}


export const Settings = () => {
    const [disableExtension, setDisableExtension] = useStorage("disableExtension", (v) => v === undefined ? false : v)
    const [enableRedditorProcessing, setEnableRedditorProcessing] = useStorage("enableRedditorProcessing", (v) => v === undefined ? false : v)
    const [enableThreadProcessing, setEnableThreadProcessing] = useStorage("enableThreadProcessing", (v) => v === undefined ? false : v)
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
    if (!accessToken) {
        return <Navigate to="/auth/login" replace={true}/>
    }

    const handleAllSettingsBtnClick = async (e) => {
        await chrome.tabs.create({url: "/tabs/index.html"})
    }

    getContentFilter().then(contentFilter => setCurrentContext(contentFilter.context))

    return (
        <base.Authenticated>
            <Form>
                <div className={"form-check"}>
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
                        checked={enableRedditorProcessing}
                        id="enableRedditorProcessing"
                        onChange={(e) => setEnableRedditorProcessing(e.target.checked)}
                        type="checkbox"
                    />
                    <Label for={"enableRedditorProcessing"}>Enable processing of redditors</Label>
                </div>
                <div className={"form-check"}>
                    <Input
                        className={"form-check-input"}
                        checked={enableThreadProcessing}
                        id="enableThreadProcessing"
                        onChange={(e) => setEnableThreadProcessing(e.target.checked)}
                        type="checkbox"
                    />
                    <Label for={"enableThreadProcessing"}>Enable processing of threads</Label>
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

            <components.ContentFilterTable
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
