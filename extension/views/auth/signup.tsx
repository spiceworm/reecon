import InfoIcon from "@mui/icons-material/Info"
import VisibilityIcon from "@mui/icons-material/Visibility"
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff"
import Alert from "@mui/material/Alert"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
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

    const formFieldsMissing = password.length === 0 || username.length === 0

    return (
        <bases.Base>
            <Stack component={"form"} onSubmit={handleSubmit} spacing={2}>
                <Stack justifyContent="center" alignItems="center">
                    <Typography variant={"h6"}>Signup</Typography>
                </Stack>

                {!signupError ? null : <Alert color={"error"}>{JSON.parse(signupError.message).detail}</Alert>}
                {!loginError ? null : <Alert color={"error"}>{JSON.parse(loginError.message).detail}</Alert>}

                <OutlinedInput
                    autoFocus={true}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={"Username"}
                    type="text"
                    endAdornment={
                        <InputAdornment position={"end"}>
                            <Tooltip
                                title={
                                    "Password reset is currently only possible if your reecon username matches your reddit account username. " +
                                    "This is because a DM must be sent to /u/reecon-admin in order to retrieve a password reset link."
                                }>
                                <InfoIcon />
                            </Tooltip>
                        </InputAdornment>
                    }
                />
                <OutlinedInput
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={"Password"}
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
                    <Button color={"primary"} disabled={signupIsLoading || loginIsLoading || formFieldsMissing} type={"submit"}>
                        {!signupIsLoading && !loginIsLoading ? (
                            "Signup"
                        ) : (
                            <>
                                <CircularProgress />
                                <span> Loading</span>
                            </>
                        )}
                    </Button>

                    <NavLink to="/auth/login">Login</NavLink>
                </Stack>
            </Stack>
        </bases.Base>
    )
}
