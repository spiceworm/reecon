import { NavLink } from "react-router-dom"
import { Badge, Container, Nav, NavItem, Spinner } from "reactstrap"
import useSWR from "swr"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as api from "~util/api"
import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const Unauthenticated = ({ children }) => {
    return (
        <Container className={"p-3"} fluid={true}>
            {children}
        </Container>
    )
}

export const Authenticated = ({ children }) => {
    const { error, isLoading } = useSWR("updateApiStatusMessages", api.updateApiStatusMessages)

    const [statusMessages] = useStorage({ instance: storage.localStorage, key: constants.STATUS_MESSAGES }, (v: types.StatusMessage[]) =>
        v === undefined ? [] : v
    )

    return (
        <Unauthenticated>
            <Nav tabs>
                <NavItem>
                    <NavLink className={"nav-link"} to={"/settings"}>
                        Settings
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink className={"nav-link"} to={"/status"}>
                        Status {isLoading ? <Spinner /> : null}
                        {statusMessages.length > 0 ? <Badge color={error ? "danger" : "warning"}>{statusMessages.length}</Badge> : null}
                    </NavLink>
                </NavItem>
            </Nav>

            {children}
        </Unauthenticated>
    )
}
