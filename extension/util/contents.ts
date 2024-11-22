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
        const processThreadDataResponse = await backgroundMessage.processThreadData(producerSettings, urlPaths)
        const contentFilter = await storage.getActiveContentFilter()

        await Promise.all([
            dom.annotatePendingThreads(processThreadDataResponse.pending, contentFilter),
            dom.annotateProcessedThreads(processThreadDataResponse.processed, contentFilter),
            dom.annotateUnprocessableThreads(processThreadDataResponse.unprocessable, contentFilter)
        ])

        const usernameElementsMap = dom.getUsernameElementsMap()
        const usernames = Object.keys(usernameElementsMap)
        const processRedditorDataResponse = await backgroundMessage.processRedditorData(producerSettings, usernames)

        await Promise.all([
            dom.annotateIgnoredRedditors(processRedditorDataResponse.ignored, usernameElementsMap, contentFilter),
            dom.annotatePendingRedditors(processRedditorDataResponse.pending, usernameElementsMap, contentFilter),
            dom.annotateProcessedRedditors(processRedditorDataResponse.processed, usernameElementsMap, contentFilter),
            dom.annotateUnprocessableRedditors(processRedditorDataResponse.unprocessable, usernameElementsMap, contentFilter)
        ])
    }
}
