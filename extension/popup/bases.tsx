import { ThreeDotsVertical } from "react-bootstrap-icons"
import { NavLink, useNavigate } from "react-router-dom"
import { Badge, DropdownItem, DropdownMenu, DropdownToggle, Nav, NavItem, UncontrolledDropdown } from "reactstrap"
import useSWR from "swr"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as api from "~util/api"
import * as bases from "~util/components/bases"
import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const Authenticated = ({ children }) => {
    const navigate = useNavigate()

    const { error, isLoading } = useSWR("updateApiStatusMessages", api.updateApiStatusMessages)

    const [statusMessages] = useStorage<(types.ApiStatusMessage | types.ExtensionStatusMessage)[]>(
        { instance: storage.extLocalStorage, key: constants.ALL_STATUS_MESSAGES },
        (v) => (v === undefined ? [] : v)
    )
    const [_, setAuth] = useStorage({ instance: storage.extLocalStorage, key: constants.AUTH })

    const logoutClickHandler = async (e) => {
        await setAuth(null)
        navigate("/auth/login", { replace: true })
    }

    const activeStatusMessage = statusMessages.filter((message: types.ApiStatusMessage | types.ExtensionStatusMessage) => message.active)

    return (
        <bases.Unauthenticated>
            <Nav tabs justified>
                <NavItem>
                    <NavLink className={"nav-link"} to={"/settings"}>
                        Settings
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink className={"nav-link"} to={"/status"}>
                        Status{" "}
                        {activeStatusMessage.length > 0 ? <Badge color={error ? "danger" : "warning"}>{activeStatusMessage.length}</Badge> : null}
                    </NavLink>
                </NavItem>
                <UncontrolledDropdown setActiveFromChild>
                    <DropdownToggle nav>
                        <ThreeDotsVertical />
                    </DropdownToggle>

                    <DropdownMenu>
                        <DropdownItem onClick={logoutClickHandler}>Logout</DropdownItem>
                    </DropdownMenu>
                </UncontrolledDropdown>
            </Nav>

            {children}
        </bases.Unauthenticated>
    )
}
