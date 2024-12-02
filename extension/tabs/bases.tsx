import { NavLink } from "react-router-dom"
import { Nav, NavItem } from "reactstrap"

import * as bases from "~util/components/bases"

export const Authenticated = ({ children }) => {
    return (
        <bases.Unauthenticated>
            <Nav tabs justified>
                <NavItem>
                    <NavLink className={"nav-link"} to={"/content-filters"}>
                        Content Filters
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink className={"nav-link"} to={"/settings"}>
                        Settings
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink className={"nav-link"} to={"/context-query"}>
                        Context Query
                    </NavLink>
                </NavItem>
            </Nav>

            {children}
        </bases.Unauthenticated>
    )
}
