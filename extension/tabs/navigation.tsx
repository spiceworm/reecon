import Tab from "@mui/material/Tab"
import Tabs from "@mui/material/Tabs"
import { Link } from "react-router-dom"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as constants from "~util/constants"
import { useRouteMatch } from "~util/routing"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const TabsNavigation = () => {
    const [llmProvidersSettings] = useStorage<types.LlmProvidersSettings>(
        { instance: storage.extLocalStorage, key: constants.LLM_PROVIDERS_SETTINGS },
        (v) => (v === undefined ? constants.defaultLlmProvidersSettings : v)
    )

    const routeMatch = useRouteMatch(["/llm-providers-settings", "/debug", "/profile", "/content-filters", "/context-query"])
    const currentTab = routeMatch?.pattern?.path

    const apiKeyMissing = llmProvidersSettings.openai.api_key.length === 0

    return (
        <Tabs value={currentTab} sx={{ borderBottom: 1, borderColor: "divider" }} variant="fullWidth">
            <Tab component={Link} label="LLM Providers Settings" to={"/llm-providers-settings"} value={"/llm-providers-settings"} />
            <Tab component={Link} label="Debug" to={"/debug"} value={"/debug"} />
            <Tab component={Link} label="Profile" to={"/profile"} value={"/profile"} />
            <Tab component={Link} disabled={apiKeyMissing} label="Content Filters" to={"/content-filters"} value={"/content-filters"} />
            <Tab component={Link} disabled={apiKeyMissing} label="Context Query" to={"/context-query"} value={"/context-query"} />
        </Tabs>
    )
}
