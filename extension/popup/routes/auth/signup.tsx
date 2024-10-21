import {useState} from "react"
import {Navigate, NavLink} from "react-router-dom"
import useSWR, {mutate} from "swr"
import {Button, Form, Input, Spinner} from "reactstrap"

import * as api from "~util/api"
import * as base from "~popup/bases"


export const Signup = () => {
    const [credentials, setCredentials] = useState(null)
    const [username, setUsername] = useState(null)
    const [password, setPassword] = useState(null)
    const {data, error, isLoading} = useSWR(credentials ? credentials : null, api.signupRequest)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setCredentials({username: username, password: password})
    }

    if (data) {
        // mutating this key will cause `api.ensureAccessToken` in the `Settings` route to get re-evaluated.
        // This is required so that we do not get redirected back to the login page.
        mutate('/api/v1/auth/token/refresh/', true).then()
        return <Navigate to="/" replace={true}/>
    }

    return (
        <base.Unauthenticated>
            <Form onSubmit={handleSubmit}>
                <div className={"mb-3"}>
                    <Input
                        onChange={(e) => {setUsername(e.target.value)}}
                        id="signupUsername"
                        placeholder={"Username"}
                        type="text"
                    />
                </div>
                <div className={"mb-3"}>
                    <Input
                        onChange={(e) => {setPassword(e.target.value)}}
                        id="signupPassword"
                        placeholder={"Password"}
                        type="password"
                    />
                </div>
                <div className="hstack gap-3 justify-content-center">
                    <Button color={"primary"} type={"submit"}>Signup</Button>
                    {isLoading && <Spinner/>}
                    {error && <p>{error.message}</p>}
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
