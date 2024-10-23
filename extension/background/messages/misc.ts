import type {PlasmoMessaging} from "@plasmohq/messaging"


const getCurrentContext = async () => {
    // FIXME: for some reason using `chrome.tabs` is undefined even though `browser.tabs` works as expected
    const tabs = await browser.tabs.query({currentWindow: true, active: true})
    const url = new URL(tabs[0].url)

    // this will be the subreddit name if we are viewing a sub or an empty string if viewing home
    const context: string = url.pathname.split('/r/').at(-1).split('/')[0]
    return context === '' ? 'default' : context
}


const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const action: string = req.body.action

    if (action === 'getCurrentContext') {
        const message = await getCurrentContext()
        res.send({message})
    } else {
        console.error(`Unhandled message with action: ${action}`)
    }
}

export default handler
