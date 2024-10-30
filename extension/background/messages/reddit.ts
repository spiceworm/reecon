import type {PlasmoMessaging} from "@plasmohq/messaging"

import * as api from "~util/api"
import type * as types from "~util/types"


const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const action: string = req.body.action

    if (action === 'getIgnoredRedditors') {
        const message = await api.getIgnoredRedditors()
        res.send({message})
    } else if (action === 'processRedditors') {
        const kwargs = req.body.kwargs
        const producerSettings = kwargs.producerSettings
        const usernames: string[] = kwargs.usernames
        const ignoredUsernames: Set<string> = kwargs.ignoredUsernames
        const message: types.Redditor[] = await api.processRedditors(producerSettings, usernames, ignoredUsernames)
        res.send({message})
    } else if (action === 'processThreads') {
        const kwargs = req.body.kwargs
        const producerSettings = kwargs.producerSettings
        const urlPaths: string[] = kwargs.urlPaths
        const message: types.Thread[] = await api.processThreads(producerSettings, urlPaths)
        res.send({message})
    } else {
        console.error(`Unhandled message with action: ${action}`)
    }
}

export default handler
