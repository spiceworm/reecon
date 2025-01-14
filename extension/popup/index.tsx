import "bootstrap/dist/css/bootstrap.min.css"

import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom"

import { ActiveSettingsView } from "~popup/views/activeSettings"
import { StatusView } from "~popup/views/status"
import { RequireAuthentication } from "~util/components/authentication"
import { LoginView } from "~views/auth/login"
import { SignupView } from "~views/auth/signup"

export default function IndexPopup() {
    return (
        <MemoryRouter>
            <Routes>
                <Route path={"/"} element={<Navigate to={"/active-settings"} replace={true} />} />
                <Route
                    path="/active-settings"
                    element={
                        <RequireAuthentication>
                            <ActiveSettingsView />
                        </RequireAuthentication>
                    }
                />
                <Route
                    path="/status"
                    element={
                        <RequireAuthentication>
                            <StatusView />
                        </RequireAuthentication>
                    }
                />

                <Route path="/auth/login" element={<LoginView onSuccessRedirectPath={"/active-settings"} />} />
                <Route path="/auth/signup" element={<SignupView onSuccessRedirectPath={"/active-settings"} />} />
            </Routes>
        </MemoryRouter>
    )
}
