import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useState } from "react"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as constants from "~util/constants"
import * as dom from "~util/dom"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const config: PlasmoCSConfig = {
    matches: ["https://*.reddit.com/", "https://*.reddit.com/r/*/", "https://*.reddit.com/user/*/"],
    exclude_matches: ["https://*.reddit.com/r/*/comments/*", "https://*.reddit.com/user/*/comments/"],
    run_at: "document_idle"
}

const styleElement = document.createElement("style")

export const getShadowHostId = () => "plasmo-shadow-host"

const styleCache = createCache({
    key: "plasmo-csui-cache",
    prepend: true,
    container: styleElement
})

// CSS is defined here because plasmo currently has a bug that prevents you from importing CSS files
// like `import cssText from "data-text:~style.css"` - https://github.com/PlasmoHQ/plasmo/issues/1156#issuecomment-2670800341
export const getStyle: PlasmoGetStyle = () => {
    styleElement.textContent = `
#plasmo-shadow-container {
    z-index: 99999;
}

#plasmo-inline {}

.fab-wrapper {
    position: fixed;
    bottom: 3rem;
    right: 3rem;
    height: 90%;
}

.fab-checkbox {
    display: none;
}

.fab {
    position: absolute;
    bottom: -1rem;
    right: -1rem;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background: rgb(61, 109, 234);
    transition: all 0.3s ease;
    z-index: 1;
    border: 1px solid rgb(61, 109, 234);
}

.fab:hover {
    box-shadow: 0px 5px 20px 5px rgba(192, 159, 222);
}

.fab-dots {
    position: absolute;
    height: 8px;
    width: 8px;
    background-color: white;
    border-radius: 50%;
    top: 50%;
    transform: translateX(0%) translateY(-50%) rotate(0deg);
    opacity: 1;
    animation: blink 3s ease infinite;
    transition: all 0.3s ease;
}

.fab-dots-1 {
    left: 8px;
    animation-delay: 0s;
}

.fab-dots-2 {
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
    animation-delay: 0.4s;
}

.fab-dots-3 {
    right: 8px;
    animation-delay: 0.8s;
}

.fab-checkbox:checked ~ .fab .fab-dots {
    height: 6px;
}

.fab .fab-dots-2 {
    transform: translateX(-50%) translateY(-50%) rotate(0deg);
}

.fab-checkbox:checked ~ .fab .fab-dots-1 {
    width: 28px;
    border-radius: 10px;
    left: 50%;
    transform: translateX(-50%) translateY(-50%) rotate(45deg);
}

.fab-checkbox:checked ~ .fab .fab-dots-3 {
    width: 28px;
    border-radius: 10px;
    right: 50%;
    transform: translateX(50%) translateY(-50%) rotate(-45deg);
}

@keyframes blink {
    50% {
        opacity: 0.25;
    }
}

.fab-checkbox:checked ~ .fab .fab-dots {
    animation: none;
}

.fab-items {
    overflow-y: scroll;
    height: 100%;
    transition: all 0.3s ease;
    transform-origin: bottom right;
    transform: scale(0);
}

.fab-checkbox:checked ~ .fab-items {
    transform: scale(1);
}

.fab-item {
    border-radius: 3px;
    background: rgba(110, 145, 239);
    width: 40rem;
    margin: 0.2rem;        
    display: flex;
    box-shadow: 0 0.1rem 1rem rgba(192, 159, 222, 0.2);
    transition: all 1s ease;
    opacity: 0;
}

.fab-content {
    margin-left: 5px;
    margin-right: 5px;
}

.fab-checkbox:checked ~ .fab-items .fab-item {
    opacity: 1;
}

.fab-item:hover {
    background-color: rgb(61, 109, 234);
}

.truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
`
    return styleElement
}

const HiddenThreadsFab = ({ threads }: { threads: types.CachedProcessedThread[] }) => {
    const [fabOpen, setFabOpen] = useState(false)

    const onClick = () => {
        setFabOpen(!fabOpen)

        // Close the fab when the user clicks outside of it
        window.onclick = (e: Event) => {
            const target = e.target as HTMLLinkElement
            if (target.id !== getShadowHostId()) {
                setFabOpen(false)
            }
        }
    }

    const threadUrlsToTitles = [...threads].map((thread) => ({ url: thread.value.url, title: dom.getThreadTitleFromUrlPath(thread.value.path) }))

    return (
        <div className="fab-wrapper" title={"Hidden Threads"}>
            <input checked={fabOpen} id="fabCheckbox" type="checkbox" className="fab-checkbox" onClick={onClick} />
            <label className="fab" htmlFor="fabCheckbox">
                <span className="fab-dots fab-dots-1"></span>
                <span className="fab-dots fab-dots-2"></span>
                <span className="fab-dots fab-dots-3"></span>
            </label>
            <div className="fab-items">
                {[...threadUrlsToTitles].map((obj, idx) => (
                    <a className="fab-item" href={obj.url} key={idx} target={"_blank"} title={obj.title}>
                        <p className={"fab-content truncate"}>{obj.title}</p>
                    </a>
                ))}
            </div>
        </div>
    )
}

const ThreadFilters = () => {
    const [activeFilter] = useStorage<types.ThreadFilter>(
        {
            instance: storage.extLocalStorage,
            key: constants.ACTIVE_THREAD_FILTER
        },
        (v) => (v === undefined ? constants.defaultThreadFilter : v)
    )
    const [disableExtension] = useStorage<boolean>({ instance: storage.extLocalStorage, key: constants.DISABLE_EXTENSION }, (v) =>
        v === undefined ? false : v
    )

    const [sentimentPolarityFilterEnabled] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.THREAD_SENTIMENT_POLARITY_CONTENT_FILTER_ENABLED },
        (v) => (v === undefined ? false : v)
    )
    const [sentimentSubjectivityFilterEnabled] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.THREAD_SENTIMENT_SUBJECTIVITY_CONTENT_FILTER_ENABLED },
        (v) => (v === undefined ? false : v)
    )

    const [hideUnprocessableThreadsEnabled] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.HIDE_UNPROCESSABLE_THREADS_ENABLED },
        (v) => (v === undefined ? false : v)
    )

    const [processedThreads] = useStorage<Record<string, types.CachedProcessedThread>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_PROCESSED_THREADS },
        (v) => (v === undefined ? {} : v)
    )
    const [unprocessableThreads] = useStorage<Record<string, types.CachedUnprocessableThread>>(
        { instance: storage.extLocalStorage, key: constants.CACHED_UNPROCESSABLE_THREADS },
        (v) => (v === undefined ? {} : v)
    )

    if (disableExtension) {
        return null
    }

    let hiddenUrlPaths = new Set<string>()
    let shownUrlPaths = new Set<string>()

    Object.keys(dom.getThreadRowElementsMap()).map((urlPath) => {
        if (urlPath in processedThreads) {
            const obj = processedThreads[urlPath]

            if (sentimentPolarityFilterEnabled && obj.value.data.sentiment_polarity.value < activeFilter.sentimentPolarity) {
                hiddenUrlPaths.add(urlPath)
            } else if (sentimentSubjectivityFilterEnabled && obj.value.data.sentiment_subjectivity.value < activeFilter.sentimentSubjectivity) {
                hiddenUrlPaths.add(urlPath)
            } else {
                shownUrlPaths.add(urlPath)
            }
        } else if (urlPath in unprocessableThreads) {
            if (hideUnprocessableThreadsEnabled) {
                hiddenUrlPaths.add(urlPath)
            } else {
                shownUrlPaths.add(urlPath)
            }
        }
    })

    if (hiddenUrlPaths.size > 0 || shownUrlPaths.size > 0) {
        dom.setThreadVisibility(hiddenUrlPaths, shownUrlPaths)
    }

    const hiddenThreads = Object.values(processedThreads).filter((thread) => hiddenUrlPaths.has(thread.value.path))

    return <CacheProvider value={styleCache}>{hiddenThreads.length > 0 ? <HiddenThreadsFab threads={hiddenThreads} /> : null}</CacheProvider>
}

export default ThreadFilters
