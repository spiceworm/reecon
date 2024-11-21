import "bootstrap/dist/css/bootstrap.min.css"

import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom"

import { Settings } from "~popup/views/settings"
import { Status } from "~popup/views/status"
import { RequireAuthentication } from "~util/components/authentication"
import { Login } from "~util/views/auth/login"
import { Signup } from "~util/views/auth/signup"

function IndexPopup() {
    return (
        <MemoryRouter>
            <Routes>
                <Route path={"/"} element={<Navigate to={"/settings"} replace={true} />} />
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

                <Route path="/auth/login" element={<Login onSuccessRedirectPath={"/settings"} />} />
                <Route path="/auth/signup" element={<Signup onSuccessRedirectPath={"/settings"} />} />
            </Routes>
        </MemoryRouter>
    )
}

export default IndexPopup
