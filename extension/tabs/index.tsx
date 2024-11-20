import "bootstrap/dist/css/bootstrap.min.css"

import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom"

import { ContentFilters } from "~tabs/routes/contentFilters"
import { ProducerSettings } from "~tabs/routes/producerSettings"
import { RequireAuthentication } from "~util/components/authentication"
import { Login } from "~util/routes/auth/login"
import { Signup } from "~util/routes/auth/signup"

export default function OptionsPage() {
    return (
        <MemoryRouter>
            <Routes>
                <Route path={"/"} element={<Navigate to={"/content-filters"} replace={true} />} />
                <Route
                    path="/producer-settings"
                    element={
                        <RequireAuthentication>
                            <ProducerSettings />
                        </RequireAuthentication>
                    }
                />
                <Route
                    path="/content-filters"
                    element={
                        <RequireAuthentication>
                            <ContentFilters />
                        </RequireAuthentication>
                    }
                />

                <Route path="/auth/login" element={<Login onSuccessRedirectPath={"/content-filters"} />} />
                <Route path="/auth/signup" element={<Signup onSuccessRedirectPath={"/content-filters"} />} />
            </Routes>
        </MemoryRouter>
    )
}
