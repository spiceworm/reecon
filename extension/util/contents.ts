import * as dom from "~util/dom"
import * as backgroundMessage from "~util/messages"
import * as storage from "~util/storage"


let lastExecution = null


export const execute = async () => {
    // FIXME: do not execute if current tab is not a reddit page

    if (lastExecution !== null && Date.now() - lastExecution < 100) {
        return
    }

    if (await storage.shouldExecuteContentScript()) {
        lastExecution = Date.now()

        const producerSettings = await storage.getProducerSettings()

        const urlPaths = dom.getThreadUrlPaths()
        const threads = await backgroundMessage.processThreads(producerSettings, urlPaths)
        const contentFilter = await storage.getActiveContentFilter()
        await dom.annotateThreads(threads, contentFilter)

        const usernameElementsMap = dom.getUsernameElementsMap()
        const usernames = Object.keys(usernameElementsMap)
        const ignoredRedditors = await backgroundMessage.getIgnoredRedditors()
        const ignoredUsernames = new Set(ignoredRedditors.map(obj => obj.username))
        const redditors = await backgroundMessage.processRedditors(producerSettings, usernames, ignoredUsernames)
        await dom.annotateUsernames(redditors, ignoredRedditors, usernameElementsMap, contentFilter)
    }
}
