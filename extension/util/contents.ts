import * as dom from "~util/dom"
import * as backgroundMessage from "~util/messages"
import * as storage from "~util/storage"


let lastExecution = null


export const execute = async () => {
    if (lastExecution !== null && Date.now() - lastExecution < 100) {
        return
    }

    if (await storage.getShouldExecuteContentScript()) {
        lastExecution = Date.now()

        const urlPaths = dom.getThreadUrlPaths()
        const threads = await backgroundMessage.processThreads(urlPaths)
        const contentFilter = await storage.getContentFilter()
        await dom.annotateThreads(threads, contentFilter)

        const usernameElementsMap = dom.getUsernameElementsMap()
        const usernames = Object.keys(usernameElementsMap)
        const ignoredRedditors = await backgroundMessage.getIgnoredRedditors()
        const ignoredUsernames = new Set(ignoredRedditors.map(obj => obj.username))
        const redditors = await backgroundMessage.processRedditors(usernames, ignoredUsernames)
        await dom.annotateUsernames(redditors, ignoredRedditors, usernameElementsMap, contentFilter)
    }
}
