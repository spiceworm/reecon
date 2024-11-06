import { signal } from "@preact/signals"
import * as react from "react"
import { Eye, EyeSlash } from "react-bootstrap-icons"
import { NavLink, useNavigate } from "react-router-dom"
import { Button, Form, Input, InputGroup, Spinner, UncontrolledAlert } from "reactstrap"
import useSWRImmutable from "swr/immutable"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as base from "~popup/bases"
import * as api from "~util/api"
import * as constants from "~util/constants"
import * as storage from "~util/storage"

const signupPassword = signal("")
const signupUsername = signal("")

export const Signup = () => {
    const [_, setAuth] = useStorage({ instance: storage.localStorage, key: constants.AUTH })
    const [passwordVisible, setPasswordVisible] = react.useState(false)
    const [signupCredentials, setSignupCredentials] = react.useState(null)
    const navigate = useNavigate()

    const {
        data: signupResponse,
        error: signupError,
        isLoading: signupIsLoading
    } = useSWRImmutable(signupCredentials ? ["/api/v1/auth/signup/", signupCredentials] : null, ([urlPath, credentials]) =>
        api.post(urlPath, credentials)
    )
    const { error: loginError, isLoading: loginIsLoading } = useSWRImmutable(
        signupResponse && !signupError && !signupIsLoading ? ["/api/v1/auth/token/", signupCredentials] : null,
        ([urlPath, credentials]) => api.post(urlPath, credentials),
        {
            onSuccess: async (data, key, config) => {
                await setAuth({ access: data.access, refresh: data.refresh })
                navigate("/settings", { replace: true })
            }
        }
    )

    const handleSubmit = async (e: react.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSignupCredentials({
            username: signupUsername.value,
            password: signupPassword.value
        })
    }

    return (
        <base.Unauthenticated>
            <p className={"text-center"}>Signup</p>

            {!signupError ? null : <UncontrolledAlert color={"danger"}>{JSON.parse(signupError.message).detail}</UncontrolledAlert>}
            {!loginError ? null : <UncontrolledAlert color={"danger"}>{JSON.parse(loginError.message).detail}</UncontrolledAlert>}

            <Form onSubmit={handleSubmit}>
                <div className={"mb-3"}>
                    <Input autoFocus={true} onChange={(e) => (signupUsername.value = e.target.value)} placeholder={"Username"} type="text" />
                </div>
                <div className={"mb-3"}>
                    <InputGroup>
                        <Input
                            onChange={(e) => (signupPassword.value = e.target.value)}
                            placeholder={"Password"}
                            type={passwordVisible ? "text" : "password"}
                        />
                        <Button
                            onClick={(e) => {
                                setPasswordVisible(!passwordVisible)
                            }}>
                            {passwordVisible ? <Eye /> : <EyeSlash />}
                        </Button>
                    </InputGroup>
                </div>
                <div className="hstack gap-3 justify-content-center">
                    <Button color={"primary"} disabled={signupIsLoading || loginIsLoading} type={"submit"}>
                        {!signupIsLoading && !loginIsLoading ? (
                            "Signup"
                        ) : (
                            <>
                                <Spinner size={"sm"} />
                                <span> Loading</span>
                            </>
                        )}
                    </Button>
                    <div className="vr"></div>
                    <NavLink className={"btn btn-link"} to="/auth/login">
                        Login
                    </NavLink>
                </div>
            </Form>
        </base.Unauthenticated>
    )
}
