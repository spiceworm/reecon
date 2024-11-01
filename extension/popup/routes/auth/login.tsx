import * as react from "react"
import {NavLink, useNavigate} from "react-router-dom"
import useSWRImmutable from "swr/immutable"
import {useStorage} from "@plasmohq/storage/dist/hook"
import {signal} from "@preact/signals"
import {Button, Form, Input, InputGroup, Spinner} from "reactstrap"
import {Eye, EyeSlash} from 'react-bootstrap-icons'

import * as api from "~util/api"
import * as base from "~popup/bases"
import * as storage from "~util/storage"


const loginPassword = signal("")
const loginUsername = signal("")


export const Login = () => {
    const [_, setAuth] = useStorage({instance: storage.instance, key: storage.AUTH})
    const [passwordVisible, setPasswordVisible] = react.useState(false)
    const [loginCredentials, setLoginCredentials] = react.useState(null)
    const navigate = useNavigate()

    const {error, isLoading} = useSWRImmutable(
        loginCredentials ? ['/api/v1/auth/token/', loginCredentials] : null,
        ([urlPath, credentials]) => api.post(urlPath, credentials),
        {
            onSuccess: async (data, key, config) => {
                await setAuth({access: data.access, refresh: data.refresh})
                navigate("/settings", {replace: true})
            }
        }
    )

    const handleSubmit = async (e: react.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoginCredentials({username: loginUsername.value, password: loginPassword.value})
    }

    return (
        <base.Unauthenticated>
            <p className={"text-center"}>Login</p>

            <Form onSubmit={handleSubmit}>
                <div className={"mb-3"}>
                    <Input
                        autoFocus={true}
                        onChange={(e) => loginUsername.value = e.target.value}
                        placeholder={"Username"}
                        type="text"
                    />
                </div>
                <div className={"mb-3"}>
                    <InputGroup>
                        <Input
                            onChange={(e) => loginPassword.value = e.target.value}
                            placeholder={"Password"}
                            type={passwordVisible ? "text" : "password"}
                        />
                        <Button onClick={(e) => {
                            setPasswordVisible(!passwordVisible)
                        }}>
                            {
                                passwordVisible ? <Eye/> : <EyeSlash/>
                            }
                        </Button>
                    </InputGroup>
                </div>
                <div className="hstack gap-3 justify-content-center">
                    <Button color={"primary"} type={"submit"}>Login</Button>
                    {isLoading && <Spinner/>}
                    {error && <p>{error.message}</p>}
                    <div className="vr"></div>
                    <NavLink
                        className={"btn btn-link"}
                        to="/auth/signup"
                    >
                        Signup
                    </NavLink>
                </div>
            </Form>
        </base.Unauthenticated>
    )
}
