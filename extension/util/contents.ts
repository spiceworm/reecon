import * as dom from "~util/dom"
import * as backgroundMessage from "~util/messages"
import * as storage from "~util/storage"

let lastExecution = null

export const execute = async () => {
    if (lastExecution !== null && Date.now() - lastExecution < 100) {
        return
    }

    if (await storage.shouldExecuteContentScript()) {
        // TODO: show visual queue in the browser that the content script got executed
        lastExecution = Date.now()

        const producerSettings = await storage.getProducerSettings()

        const urlPaths = dom.getThreadUrlPaths()
        const processThreadsResponse = await backgroundMessage.processThreads(producerSettings, urlPaths)
        const contentFilter = await storage.getActiveContentFilter()

        await Promise.all([
            dom.annotatePendingThreads(processThreadsResponse.pending, contentFilter),
            dom.annotateProcessedThreads(processThreadsResponse.processed, contentFilter),
            dom.annotateUnprocessableThreads(processThreadsResponse.unprocessable, contentFilter)
        ])

        const usernameElementsMap = dom.getUsernameElementsMap()
        const usernames = Object.keys(usernameElementsMap)
        const processRedditorsResponse = await backgroundMessage.processRedditors(producerSettings, usernames)

        await Promise.all([
            dom.annotateIgnoredRedditors(processRedditorsResponse.ignored, usernameElementsMap, contentFilter),
            dom.annotatePendingRedditors(processRedditorsResponse.pending, usernameElementsMap, contentFilter),
            dom.annotateProcessedRedditors(processRedditorsResponse.processed, usernameElementsMap, contentFilter),
            dom.annotateUnprocessableRedditors(processRedditorsResponse.unprocessable, usernameElementsMap, contentFilter)
        ])
    }
}
