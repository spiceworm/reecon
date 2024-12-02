import "bootstrap/dist/css/bootstrap.min.css"

import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom"

import { ContentFilters } from "~tabs/views/contentFilters"
import { ContextQuery } from "~tabs/views/contextQuery"
import { RequireAuthentication } from "~util/components/authentication"
import { Settings } from "~tabs/views/settings"
import { Login } from "~util/views/auth/login"
import { Signup } from "~util/views/auth/signup"

export default function OptionsPage() {
    return (
        <MemoryRouter>
            <Routes>
                <Route path={"/"} element={<Navigate to={"/content-filters"} replace={true} />} />
                <Route
                    path="/context-query"
                    element={
                        <RequireAuthentication>
                            <ContextQuery />
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
