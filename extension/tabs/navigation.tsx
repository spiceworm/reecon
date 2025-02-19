import Tab from "@mui/material/Tab"
import Tabs from "@mui/material/Tabs"
import { Link } from "react-router-dom"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as constants from "~util/constants"
import { useRouteMatch } from "~util/routing"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const TabsNavigation = () => {
    const [producerSettings] = useStorage<types.ProducerSettings>({ instance: storage.extLocalStorage, key: constants.PRODUCER_SETTINGS }, (v) =>
        v === undefined ? constants.defaultProducerSettings : v
    )

    const routeMatch = useRouteMatch(["/producer-settings", "/debug", "/profile", "/content-filters", "/context-query"])
    const currentTab = routeMatch?.pattern?.path

    const producerApiKeyMissing = producerSettings.openai.api_key.length === 0

    return (
        <Tabs value={currentTab} sx={{ borderBottom: 1, borderColor: "divider" }} variant="fullWidth">
            <Tab component={Link} label="Producer Settings" to={"/producer-settings"} value={"/producer-settings"} />
            <Tab component={Link} label="Debug" to={"/debug"} value={"/debug"} />
            <Tab component={Link} label="Profile" to={"/profile"} value={"/profile"} />
            <Tab component={Link} disabled={producerApiKeyMissing} label="Content Filters" to={"/content-filters"} value={"/content-filters"} />
            <Tab component={Link} disabled={producerApiKeyMissing} label="Context Query" to={"/context-query"} value={"/context-query"} />
        </Tabs>
    )
}
