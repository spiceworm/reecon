import Tab from "@mui/material/Tab"
import Tabs from "@mui/material/Tabs"
import { useState, type SyntheticEvent } from "react"
import { Link } from "react-router-dom"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const TabsNavigation = () => {
    const [currentTab, setCurrentTab] = useState(0)

    const [producerSettings] = useStorage<types.ProducerSettings>({ instance: storage.extLocalStorage, key: constants.PRODUCER_SETTINGS }, (v) =>
        v === undefined ? constants.defaultProducerSettings : v
    )

    const handleTabChange = (event: SyntheticEvent, tabIndex: number) => {
        setCurrentTab(tabIndex)
    }

    const producerApiKeyMissing = producerSettings.openai.api_key.length === 0

    return (
        <Tabs value={currentTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: "divider" }} variant="fullWidth">
            <Tab component={Link} label="Producer Settings" to={"/producer-settings"} value={"/producer-settings"} />
            <Tab component={Link} label="Debug" to={"/debug"} value={"/debug"} />
            <Tab component={Link} label="Profile" to={"/profile"} value={"/profile"} />
            <Tab component={Link} disabled={producerApiKeyMissing} label="Content Filters" to={"/content-filters"} value={"/content-filters"} />
            <Tab component={Link} disabled={producerApiKeyMissing} label="Context Query" to={"/context-query"} value={"/context-query"} />
        </Tabs>
    )
}
