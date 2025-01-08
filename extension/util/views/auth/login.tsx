import { useState, type FormEvent } from "react"
import { Eye, EyeSlash } from "react-bootstrap-icons"
import { NavLink, useNavigate } from "react-router-dom"
import { Button, Form, Input, InputGroup, Spinner, UncontrolledAlert } from "reactstrap"
import useSWRImmutable from "swr/immutable"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as api from "~util/api"
import * as bases from "~util/components/bases"
import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const Login = ({ onSuccessRedirectPath }) => {
    const [_, setAuth] = useStorage<types.Auth>({
        instance: storage.extLocalStorage,
        key: constants.AUTH
    })
    const [passwordVisible, setPasswordVisible] = useState(false)
    const [loginCredentials, setLoginCredentials] = useState(null)
    const [password, setPassword] = useState<string>("")
    const [username, setUsername] = useState<string>("")
    const navigate = useNavigate()

    const { error, isLoading } = useSWRImmutable(
        loginCredentials ? ["/api/v1/auth/token/", loginCredentials] : null,
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
        setLoginCredentials({
            username: username,
            password: password
        })
    }

    const formFieldsMissing = password.length === 0 || username.length === 0

    return (
        <bases.Unauthenticated>
            <p className={"text-center"}>Login</p>

            {error ? <UncontrolledAlert color={"danger"}>{JSON.parse(error.message).detail}</UncontrolledAlert> : null}

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
                    <Button color={"primary"} disabled={isLoading || formFieldsMissing} type={"submit"}>
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
        </bases.Unauthenticated>
    )
}
