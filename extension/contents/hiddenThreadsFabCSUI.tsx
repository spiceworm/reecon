import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useState } from "react"

import * as dom from "~util/dom"

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

const HiddenThreadsFab = () => {
    const [fabOpen, setFabOpen] = useState(false)

    const hiddenThreadRows: HTMLDivElement[] = Array.from(document.querySelectorAll('div[reecon-filter="true"]'))
    const hiddenThreadUrlPaths = hiddenThreadRows.map((el) => el.getAttribute("data-permalink"))
    const hiddenThreads = hiddenThreadUrlPaths.map((urlPath) => ({
        url: `https://old.reddit.com${urlPath}`,
        title: dom.getThreadTitleFromUrlPath(urlPath)
    }))

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

    return (
        <CacheProvider value={styleCache}>
            {hiddenThreadRows.length > 0 ? (
                <div className="fab-wrapper" title={"Hidden Threads"}>
                    <input checked={fabOpen} id="fabCheckbox" type="checkbox" className="fab-checkbox" onClick={onClick} />
                    <label className="fab" htmlFor="fabCheckbox">
                        <span className="fab-dots fab-dots-1"></span>
                        <span className="fab-dots fab-dots-2"></span>
                        <span className="fab-dots fab-dots-3"></span>
                    </label>
                    <div className="fab-items">
                        {[...hiddenThreads].map((obj, idx) => (
                            <a className="fab-item" href={obj.url} key={idx} target={"_blank"} title={obj.title}>
                                <p className={"fab-content truncate"}>{obj.title}</p>
                            </a>
                        ))}
                    </div>
                </div>
            ) : null}
        </CacheProvider>
    )
}

export default HiddenThreadsFab
