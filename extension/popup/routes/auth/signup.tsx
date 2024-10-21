import {Button, Form, Input} from "reactstrap"
import {NavLink} from "react-router-dom"

import * as base from "~popup/bases"


export const Signup = () => {
    return (
        <base.Unauthenticated>
            <Form>
                <div className={"mb-3"}>
                    <Input id="signupUsername" placeholder={"Username"} type="text"/>
                </div>
                <div className={"mb-3"}>
                    <Input id="signupPassword" placeholder={"Password"} type="password"/>
                </div>
                <div className="hstack gap-3 justify-content-center">
                    <Button color={"primary"} type={"submit"}>Signup</Button>
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
