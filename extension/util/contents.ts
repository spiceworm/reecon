import * as backgroundMessage from "~util/backgroundMessages"
import * as dom from "~util/dom"
import * as storage from "~util/storage"

let lastExecution = null

export const execute = async () => {
    if (lastExecution !== null && Date.now() - lastExecution < 1000) {
        return
    }

    if (await storage.shouldExecuteContentScript()) {
        lastExecution = Date.now()

        // TODO: Do not pass content filter to annotate functions. All filtering is done via separate content scripts
        const contentFilter = await storage.getActiveCommentFilter()
        const producerSettings = await storage.getProducerSettings()

        if (await storage.getThreadDataProcessingEnabled()) {
            const urlPaths = dom.getThreadUrlPaths()
            const processThreadDataResponse = await backgroundMessage.processThreadData(producerSettings, urlPaths)

            await Promise.all([
                dom.annotatePendingThreads(processThreadDataResponse.pending, contentFilter),
                dom.annotateProcessedThreads(processThreadDataResponse.processed, contentFilter),
                dom.annotateUnprocessableThreads(processThreadDataResponse.unprocessable, contentFilter)
            ])
        }

        if (await storage.getRedditorDataProcessingEnabled()) {
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
}
