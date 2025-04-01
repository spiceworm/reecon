import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useState } from "react"
import useSWR from "swr"

import * as api from "~util/api"
import type { Profile } from "~util/types/backend/reecon/modelSerializers"

export const ProfileData = () => {
    const [profile, setProfile] = useState<Profile>()
    const { error, isLoading } = useSWR("/api/v1/profile/", api.authGet, {
        onSuccess: (data: Profile, key, config) => {
            console.log(data)
            setProfile(data)
        },
        onError: (error) => {
            console.log(error)
        }
    })

    const linkAccountsArgs = new URLSearchParams({
        message: profile?.signed_username,
        subject: "link-reddit-username",
        to: process.env.PLASMO_PUBLIC_REDDIT_BOT
    }).toString()

    const unlinkAccountsArgs = new URLSearchParams({
        message: profile?.signed_username,
        subject: "unlink-reddit-username",
        to: process.env.PLASMO_PUBLIC_REDDIT_BOT
    }).toString()

    return (
        <Stack spacing={2}>
            <Typography>Date joined: {profile?.user.date_joined.toString()}</Typography>
            <Typography>Reecon username: {profile?.user.username}</Typography>
            <Stack alignItems={"center"} direction={"row"} spacing={2}>
                <Typography>Reddit username:</Typography>

                {!profile?.reddit_username ? (
                    <Button href={`https://old.reddit.com/message/compose?${linkAccountsArgs}`} target="_blank">
                        Link reddit username
                    </Button>
                ) : (
                    <>
                        <Typography>{profile?.reddit_username}</Typography>

                        <Button href={`https://old.reddit.com/message/compose?${unlinkAccountsArgs}`} target="_blank">
                            Unlink reddit username
                        </Button>
                    </>
                )}
            </Stack>
        </Stack>
    )
}
