import "bootstrap/dist/css/bootstrap.min.css"

import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom"

import { useStorage } from "@plasmohq/storage/dist/hook"

import { ContentFilters } from "~tabs/views/contentFilters"
import { ContextQuery } from "~tabs/views/contextQuery"
import { Debug } from "~tabs/views/debug"
import { Profile } from "~tabs/views/profile"
import { Settings } from "~tabs/views/settings"
import { RequireAuthentication } from "~util/components/authentication"
import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"
import { Login } from "~util/views/auth/login"
import { Signup } from "~util/views/auth/signup"

export default function OptionsPage() {
    const [producerSettings] = useStorage({ instance: storage.extLocalStorage, key: constants.PRODUCER_SETTINGS }, (v: types.ProducerSettings) =>
        v === undefined ? constants.defaultProducerSettings : v
    )

    const producerApiKeyMissing = producerSettings.openai.api_key.length === 0

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

                <Route path="/auth/login" element={<Login onSuccessRedirectPath={"/content-filters"} />} />
                <Route path="/auth/signup" element={<Signup onSuccessRedirectPath={"/content-filters"} />} />
                <Route path="/debug" element={<Debug />} />
                <Route path="/profile" element={<Profile />} />

                {producerApiKeyMissing ? null : (
                    <>
                        <Route
                            path="/context-query"
                            element={
                                <RequireAuthentication>
                                    <ContextQuery />
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
                    </>
                )}
            </Routes>
        </MemoryRouter>
    )
}
