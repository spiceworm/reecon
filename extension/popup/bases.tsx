import { ExclamationTriangleFill } from "react-bootstrap-icons"
import { NavLink } from "react-router-dom"
import { Container, Nav, NavItem } from "reactstrap"

import { useStorage } from "@plasmohq/storage/dist/hook"

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
  const [localStatusMessages] = useStorage(
    { instance: storage.localStorage, key: constants.LOCAL_STATUS_MESSAGES },
    (v: types.StatusMessage[]) => (v === undefined ? [] : v)
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
            Status{" "}
            {localStatusMessages.some((message) => message.active) ? (
              <ExclamationTriangleFill color={"orange"} />
            ) : null}
          </NavLink>
        </NavItem>
      </Nav>

      {children}
    </Unauthenticated>
  )
}
