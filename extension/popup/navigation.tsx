import MoreVertIcon from "@mui/icons-material/MoreVert"
import Box from "@mui/material/Box"
import IconButton from "@mui/material/IconButton"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Tab from "@mui/material/Tab"
import Tabs from "@mui/material/Tabs"
import Grid from "@mui/material/Unstable_Grid2"
import { useState, type MouseEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import useSWR from "swr"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as api from "~util/api"
import { IconlessBadge, UIThemeControls } from "~util/components/mui"
import * as constants from "~util/constants"
import { useRouteMatch } from "~util/routing"
import * as storage from "~util/storage"
import type * as types from "~util/types"

const NavigationTabs = () => {
    const { error } = useSWR("updateApiStatusMessages", api.updateApiStatusMessages)
    const [statusMessages] = useStorage<(types.ApiStatusMessage | types.ExtensionStatusMessage)[]>(
        { instance: storage.extLocalStorage, key: constants.ALL_STATUS_MESSAGES },
        (v) => (v === undefined ? [] : v)
    )
    const activeStatusMessages = statusMessages.filter((message: types.ApiStatusMessage | types.ExtensionStatusMessage) => message.active)

    const routeMatch = useRouteMatch(["/active-settings", "/status"])
    const currentTab = routeMatch?.pattern?.path

    return (
        <Tabs value={currentTab} variant="fullWidth">
            <Tab component={Link} label="Active Settings" to={"/active-settings"} value={"/active-settings"} />
            <Tab
                component={Link}
                icon={<IconlessBadge badgeContent={activeStatusMessages.length} color={error ? "error" : "info"} />}
                iconPosition={"end"}
                label="Status"
                to={"/status"}
                value={"/status"}
            />
        </Tabs>
    )
}

const NavigationDropdown = () => {
    const navigate = useNavigate()
    const [_, setAuth] = useStorage({ instance: storage.extLocalStorage, key: constants.AUTH })

    const [dropdownAnchorEl, setDropdownAnchorEl] = useState<HTMLElement | null>(null)
    const dropdownIsOpen = Boolean(dropdownAnchorEl)

    const logoutClickHandler = async (e) => {
        await setAuth(null)
        navigate("/auth/login", { replace: true })
    }

    return (
        <Box>
            <IconButton onClick={(e: MouseEvent<HTMLButtonElement>) => setDropdownAnchorEl(e.currentTarget)}>
                <MoreVertIcon />
            </IconButton>

            <Menu anchorEl={dropdownAnchorEl} open={dropdownIsOpen} onClose={() => setDropdownAnchorEl(null)}>
                <MenuItem>
                    <UIThemeControls />
                </MenuItem>
                <MenuItem onClick={logoutClickHandler}>Logout</MenuItem>
            </Menu>
        </Box>
    )
}

export const PopupNavigation = () => {
    return (
        <Grid container sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Grid xs={11} sm={11} md={11} lg={11} xl={11}>
                <NavigationTabs />
            </Grid>
            <Grid xs={1} sm={1} md={1} lg={1} xl={1}>
                <NavigationDropdown />
            </Grid>
        </Grid>
    )
}
