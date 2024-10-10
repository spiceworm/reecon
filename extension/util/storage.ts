import {Storage} from "@plasmohq/storage";

import * as backgroundMessage from "~util/messages"
import type * as types from "~util/types"


export const storage = new Storage()


export const getContentFilter = async () => {
    const context: string = await backgroundMessage.getCurrentContext()

    for (const contentFilter of await storage.get('contentFilters') as types.ContentFilter[]) {
        if (contentFilter.context === context) {
            return contentFilter
        }
    }

    return await storage.get('defaultFilter') as types.ContentFilter
}
