import type {PlasmoCSConfig} from "plasmo"
import { relayMessage } from "@plasmohq/messaging"

import {execute} from "~util/contents"


export const config: PlasmoCSConfig = {
    matches: [
        "https://www.reddit.com/r/*/comments/*",
    ],
}


// TODO: execute main in a less aggressive way
window.addEventListener('scroll', function () {
    execute().then()
})
