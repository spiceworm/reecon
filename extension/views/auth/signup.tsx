import { useState, type FormEvent } from "react"
import { ExclamationCircle, Eye, EyeSlash } from "react-bootstrap-icons"
import { NavLink, useNavigate } from "react-router-dom"
import { Button, Form, Input, InputGroup, Spinner, UncontrolledAlert } from "reactstrap"
import useSWRImmutable from "swr/immutable"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as api from "~util/api"
import * as bases from "~util/components/bases"
import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const SignupView = ({ onSuccessRedirectPath }) => {
    const [_, setAuth] = useStorage<types.Auth>({ instance: storage.extLocalStorage, key: constants.AUTH })
    const [passwordVisible, setPasswordVisible] = useState(false)
    const [signupCredentials, setSignupCredentials] = useState(null)
    const [password, setPassword] = useState<string>("")
    const [username, setUsername] = useState<string>("")
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
                navigate(onSuccessRedirectPath, { replace: true })
            }
        }
    )

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSignupCredentials({
            username: username,
            password: password
        })
    }

    const formFieldsMissing = password.length === 0 || username.length === 0

    return (
        <bases.Base>
            <p className={"text-center"}>
                Signup{" "}
                <ExclamationCircle
                    title={
                        "Password reset is currently only possible if your reecon username matches your reddit account username. " +
                        "This is because a DM must be sent to /u/reecon-admin in order to retrieve a password reset link."
                    }
                />
            </p>

            {!signupError ? null : <UncontrolledAlert color={"danger"}>{JSON.parse(signupError.message).detail}</UncontrolledAlert>}
            {!loginError ? null : <UncontrolledAlert color={"danger"}>{JSON.parse(loginError.message).detail}</UncontrolledAlert>}

            <Form onSubmit={handleSubmit}>
                <div className={"mb-3"}>
                    <Input autoFocus={true} onChange={(e) => setUsername(e.target.value)} placeholder={"Username"} type="text" />
                </div>
                <div className={"mb-3"}>
                    <InputGroup>
                        <Input onChange={(e) => setPassword(e.target.value)} placeholder={"Password"} type={passwordVisible ? "text" : "password"} />
                        <Button
                            onClick={(e) => {
                                setPasswordVisible(!passwordVisible)
                            }}>
                            {passwordVisible ? <Eye /> : <EyeSlash />}
                        </Button>
                    </InputGroup>
                </div>
                <div className="hstack gap-3 justify-content-center">
                    <Button color={"primary"} disabled={signupIsLoading || loginIsLoading || formFieldsMissing} type={"submit"}>
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
        </bases.Base>
    )
}
