import { NavLink } from "react-router-dom"
import { Nav, NavItem } from "reactstrap"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as bases from "~util/components/bases"
import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const Authenticated = ({ children }) => {
    const [producerSettings] = useStorage<types.ProducerSettings>({ instance: storage.extLocalStorage, key: constants.PRODUCER_SETTINGS }, (v) =>
        v === undefined ? constants.defaultProducerSettings : v
    )

    const producerApiKeyMissing = producerSettings.openai.api_key.length === 0

    return (
        <bases.Unauthenticated>
            <Nav tabs justified>
                <NavItem>
                    <NavLink className={"nav-link"} to={"/settings"}>
                        Settings
                    </NavLink>
                </NavItem>

                <NavItem>
                    <NavLink className={"nav-link"} to={"/debug"}>
                        Debug
                    </NavLink>
                </NavItem>

                <NavItem>
                    <NavLink className={"nav-link"} to={"/profile"}>
                        Profile
                    </NavLink>
                </NavItem>

                {producerApiKeyMissing ? null : (
                    <>
                        <NavItem>
                            <NavLink className={"nav-link"} to={"/content-filters"}>
                                Content Filters
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink className={"nav-link"} to={"/context-query"}>
                                Context Query
                            </NavLink>
                        </NavItem>
                    </>
                )}
            </Nav>

            {children}
        </bases.Unauthenticated>
    )
}
