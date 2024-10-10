import * as data from "~util/storage"
import * as dom from "~util/dom"
import * as backgroundMessage from "~util/messages"


export const execute = async () => {
    const settings = await data.storage.getMany([
        'disableExtension',
        'enableRedditorProcessing',
        'enableThreadProcessing',
    ])

    if (!settings.disableExtension) {
        data.getContentFilter().then(contentFilter => {
            if (settings.enableThreadProcessing) {
                const urlPaths = dom.getThreadUrlPaths()

                backgroundMessage.processThreads(urlPaths).then(threads => {
                    dom.annotateThreads(threads, contentFilter).then()
                })
            }

            if (settings.enableRedditorProcessing) {
                const usernameElementsMap = dom.getUsernameElementsMap()
                const usernames = Object.keys(usernameElementsMap)

                backgroundMessage.getIgnoredRedditors().then(ignoredRedditors => {
                    const ignoredUsernames = new Set(ignoredRedditors.map(obj => obj.username))

                    backgroundMessage.processRedditors(usernames, ignoredUsernames).then(redditors => {
                        dom.annotateUsernames(redditors, ignoredRedditors, usernameElementsMap, contentFilter).then()
                    })
                })
            }
        })
    }
}
