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
        const processThreadsDataResponse = await backgroundMessage.processThreadsData(producerSettings, urlPaths)
        const contentFilter = await storage.getActiveContentFilter()

        await Promise.all([
            dom.annotatePendingThreads(processThreadsDataResponse.pending, contentFilter),
            dom.annotateProcessedThreads(processThreadsDataResponse.processed, contentFilter),
            dom.annotateUnprocessableThreads(processThreadsDataResponse.unprocessable, contentFilter)
        ])

        const usernameElementsMap = dom.getUsernameElementsMap()
        const usernames = Object.keys(usernameElementsMap)
        const processRedditorsDataResponse = await backgroundMessage.processRedditorsData(producerSettings, usernames)

        await Promise.all([
            dom.annotateIgnoredRedditors(processRedditorsDataResponse.ignored, usernameElementsMap, contentFilter),
            dom.annotatePendingRedditors(processRedditorsDataResponse.pending, usernameElementsMap, contentFilter),
            dom.annotateProcessedRedditors(processRedditorsDataResponse.processed, usernameElementsMap, contentFilter),
            dom.annotateUnprocessableRedditors(processRedditorsDataResponse.unprocessable, usernameElementsMap, contentFilter)
        ])
    }
}
