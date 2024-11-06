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

const loginPassword = signal("")
const loginUsername = signal("")

export const Login = () => {
    const [_, setAuth] = useStorage({
        instance: storage.localStorage,
        key: constants.AUTH
    })
    const [passwordVisible, setPasswordVisible] = react.useState(false)
    const [loginCredentials, setLoginCredentials] = react.useState(null)
    const navigate = useNavigate()

    const { error, isLoading } = useSWRImmutable(
        loginCredentials ? ["/api/v1/auth/token/", loginCredentials] : null,
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
        setLoginCredentials({
            username: loginUsername.value,
            password: loginPassword.value
        })
    }

    return (
        <base.Unauthenticated>
            <p className={"text-center"}>Login</p>

            {error ? <UncontrolledAlert color={"danger"}>{JSON.parse(error.message).detail}</UncontrolledAlert> : null}

            <Form onSubmit={handleSubmit}>
                <div className={"mb-3"}>
                    <Input autoFocus={true} onChange={(e) => (loginUsername.value = e.target.value)} placeholder={"Username"} type="text" />
                </div>
                <div className={"mb-3"}>
                    <InputGroup>
                        <Input
                            onChange={(e) => (loginPassword.value = e.target.value)}
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
                    <Button color={"primary"} disabled={isLoading} type={"submit"}>
                        {!isLoading ? (
                            "Login"
                        ) : (
                            <>
                                <Spinner size={"sm"} />
                                <span> Loading</span>
                            </>
                        )}
                    </Button>
                    <div className="vr"></div>
                    <NavLink className={"btn btn-link"} to="/auth/signup">
                        Signup
                    </NavLink>
                </div>
            </Form>
        </base.Unauthenticated>
    )
}
