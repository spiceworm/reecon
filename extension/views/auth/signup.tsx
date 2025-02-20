import InfoIcon from "@mui/icons-material/Info"
import VisibilityIcon from "@mui/icons-material/Visibility"
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff"
import LoadingButton from "@mui/lab/LoadingButton"
import Alert from "@mui/material/Alert"
import Divider from "@mui/material/Divider"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import OutlinedInput from "@mui/material/OutlinedInput"
import Stack from "@mui/material/Stack"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import { useState, type FormEvent } from "react"
import { NavLink, useNavigate } from "react-router-dom"
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

    return (
        <bases.Base>
            <Stack component={"form"} m={2} onSubmit={handleSubmit} spacing={2}>
                <Stack justifyContent="center" alignItems="center">
                    <Typography variant={"h6"}>Signup</Typography>
                </Stack>

                {!signupError ? null : <Alert color={"error"}>{signupError.message}</Alert>}
                {!loginError ? null : <Alert color={"error"}>{loginError.message}</Alert>}

                <OutlinedInput
                    autoFocus={true}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={"Username"}
                    required={true}
                    type="text"
                    endAdornment={
                        <InputAdornment position={"end"}>
                            <Tooltip
                                title={`Bot actions, such as password reset, are performed by sending a reddit DM to /u/${process.env.PLASMO_PUBLIC_REDDIT_BOT}.
                                        Bot actions are only possible for reecon accounts that have successfully verified their reddit username.
                                        You can only verify your reddit username if it matches your reecon username.
                                        IT IS STRONGLY RECOMMENDED TO USE THE SAME USERNAME FOR REECON AS YOU USE FOR REDDIT.`}>
                                <InfoIcon />
                            </Tooltip>
                        </InputAdornment>
                    }
                />
                <OutlinedInput
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={"Password"}
                    required={true}
                    type={passwordVisible ? "text" : "password"}
                    endAdornment={
                        <InputAdornment position={"end"}>
                            <IconButton onClick={(e) => setPasswordVisible(!passwordVisible)}>
                                {passwordVisible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                            </IconButton>
                        </InputAdornment>
                    }
                />

                <Stack direction="row" divider={<Divider orientation="vertical" flexItem />} justifyContent="center" alignItems="center" spacing={2}>
                    <LoadingButton
                        color={"primary"}
                        disabled={signupIsLoading || loginIsLoading}
                        loading={signupIsLoading || loginIsLoading}
                        type={"submit"}>
                        <span>signup</span>
                    </LoadingButton>
                    <NavLink to="/auth/login">Login</NavLink>
                </Stack>
            </Stack>
        </bases.Base>
    )
}
