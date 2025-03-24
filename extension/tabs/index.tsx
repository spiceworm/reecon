import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom"

import { useStorage } from "@plasmohq/storage/dist/hook"

import { ContentFiltersView } from "~tabs/views/contentFilters"
import { ContextQueryView } from "~tabs/views/contextQuery"
import { DebugView } from "~tabs/views/debug"
import { LlmProvidersSettingsView } from "~tabs/views/llmProvidersSettings"
import { ProfileView } from "~tabs/views/profile"
import { RequireAuthentication } from "~util/components/authentication"
import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"
import { LoginView } from "~views/auth/login"
import { SignupView } from "~views/auth/signup"

export default function TabsIndex() {
    const [llmProvidersSettings] = useStorage(
        { instance: storage.extLocalStorage, key: constants.LLM_PROVIDERS_SETTINGS },
        (v: types.LlmProvidersSettings) => (v === undefined ? constants.defaultLlmProvidersSettings : v)
    )

    const apiKeyMissing = llmProvidersSettings.openai.api_key.length === 0

    return (
        <MemoryRouter>
            <Routes>
                <Route path={"/"} element={<Navigate to={"/llm-providers-settings"} replace={true} />} />
                <Route
                    path="/llm-providers-settings"
                    element={
                        <RequireAuthentication>
                            <LlmProvidersSettingsView />
                        </RequireAuthentication>
                    }
                />

                <Route path="/auth/login" element={<LoginView onSuccessRedirectPath={"/content-filters"} />} />
                <Route path="/auth/signup" element={<SignupView onSuccessRedirectPath={"/content-filters"} />} />
                <Route path="/debug" element={<DebugView />} />
                <Route path="/profile" element={<ProfileView />} />

                {apiKeyMissing ? null : (
                    <>
                        <Route
                            path="/context-query"
                            element={
                                <RequireAuthentication>
                                    <ContextQueryView />
                                </RequireAuthentication>
                            }
                        />
                        <Route
                            path="/content-filters"
                            element={
                                <RequireAuthentication>
                                    <ContentFiltersView />
                                </RequireAuthentication>
                            }
                        />
                    </>
                )}
            </Routes>
        </MemoryRouter>
    )
}
