import type {PlasmoMessaging} from "@plasmohq/messaging"


const getCurrentContext = async (): Promise<string> => {
    // FIXME: for some reason using `chrome.tabs` is undefined even though `browser.tabs` works as expected
    const tabs = await browser.tabs.query({currentWindow: true, active: true})
    const url = new URL(tabs[0].url)

    // this will be the subreddit name if we are viewing a sub or an empty string if viewing home
    const context: string = url.pathname.split('/r/').at(-1).split('/')[0]
    return context === '' ? 'default' : context
}


const setPopupIcon = async (color: string | null, text: string): Promise<null> => {
    await chrome.browserAction.setBadgeText({text: text})
    await chrome.browserAction.setBadgeBackgroundColor({color: color})
    return null
}


const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const action: string = req.body.action

    if (action === 'getCurrentContext') {
        return getCurrentContext().then(message => res.send({message}))
    } else if (action === 'setPopupIcon') {
        const kwargs = req.body.kwargs
        const color = kwargs.color
        const text = kwargs.text
        return setPopupIcon(color, text).then(message => res.send({message}))
    } else {
        console.error(`Unhandled message with action: ${action}`)
    }
}

export default handler
