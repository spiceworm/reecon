import { NavLink } from "react-router-dom"
import { Container, Nav, NavItem } from "reactstrap"

export const Unauthenticated = ({ children }) => {
  return <Container className={"p-3"}>{children}</Container>
}

export const Authenticated = ({ children }) => {
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
            Status
          </NavLink>
        </NavItem>
      </Nav>

      {children}
    </Unauthenticated>
  )
}
