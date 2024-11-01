import * as react from "react"
import {NavLink, useNavigate} from "react-router-dom"
import useSWRImmutable from "swr/immutable"
import {useStorage} from "@plasmohq/storage/dist/hook"
import {signal} from "@preact/signals"
import {Button, Form, Input, Spinner} from "reactstrap"

import * as api from "~util/api"
import * as base from "~popup/bases"
import * as storage from "~util/storage"


const signupPassword = signal("")
const signupUsername = signal("")


export const Signup = () => {
    const [_, setAuth] = useStorage({instance: storage.instance, key: storage.AUTH})
    const [signupCredentials, setSignupCredentials] = react.useState(null)
    const navigate = useNavigate()

    const {data: signupResponse, error: signupError, isLoading: signupIsLoading} = useSWRImmutable(
        signupCredentials ? ['/api/v1/auth/signup/', signupCredentials] : null,
        ([urlPath, credentials]) => api.post(urlPath, credentials),
    )
    const {error: loginError, isLoading: loginIsLoading} = useSWRImmutable(
        signupResponse && !signupError && !signupIsLoading ? ['/api/v1/auth/token/', signupCredentials] : null,
        ([urlPath, credentials]) =>
        api.post(urlPath, credentials),
        {
            onSuccess: async (data, key, config) => {
                await setAuth({access: data.access, refresh: data.refresh})
                navigate("/settings", {replace: true})
            }
        }
    )

    const handleSubmit = async (e: react.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSignupCredentials({username: signupUsername.value, password: signupPassword.value})
    }

    return (
        <base.Unauthenticated>
            <Form onSubmit={handleSubmit}>
                <div className={"mb-3"}>
                    <Input
                        autoFocus={true}
                        onChange={(e) => signupUsername.value = e.target.value}
                        id="signupUsername"
                        placeholder={"Username"}
                        type="text"
                    />
                </div>
                <div className={"mb-3"}>
                    <Input
                        onChange={(e) => signupPassword.value = e.target.value}
                        id="signupPassword"
                        placeholder={"Password"}
                        type="password"
                    />
                </div>
                <div className="hstack gap-3 justify-content-center">
                    <Button color={"primary"} type={"submit"}>Signup</Button>
                    {signupIsLoading || loginIsLoading ? <Spinner/> : null}
                    {signupError && <p>{signupError.message}</p>}
                    {loginError && <p>{loginError.message}</p>}
                    <div className="vr"></div>
                    <NavLink
                        className={"btn btn-link"}
                        id={"loginNavButton"}
                        to="/auth/login"
                    >
                        Login
                    </NavLink>
                </div>
            </Form>
        </base.Unauthenticated>
    )
}
