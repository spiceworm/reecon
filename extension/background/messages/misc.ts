import type {PlasmoMessaging} from "@plasmohq/messaging"

import * as dom from "~util/dom"


const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const action: string = req.body.action

    if (action === 'getCurrentContext') {
        const message = dom.getCurrentContext()
        res.send({message})
    } else {
        console.error(`Unhandled message with action: ${action}`)
    }
}

export default handler
