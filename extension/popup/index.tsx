import "bootstrap/dist/css/bootstrap.min.css"

import { MemoryRouter, Route, Routes } from "react-router-dom"

import { Login } from "~popup/routes/auth/login"
import { Signup } from "~popup/routes/auth/signup"
import { Settings } from "~popup/routes/settings"
import { Status } from "~popup/routes/status"
import { RequireAuthentication } from "~util/components/authentication"

function IndexPopup() {
  return (
    <MemoryRouter>
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuthentication>
              <Settings />
            </RequireAuthentication>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuthentication>
              <Settings />
            </RequireAuthentication>
          }
        />
        <Route
          path="/status"
          element={
            <RequireAuthentication>
              <Status />
            </RequireAuthentication>
          }
        />

        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
      </Routes>
    </MemoryRouter>
  )
}

export default IndexPopup
