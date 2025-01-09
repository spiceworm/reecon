import { useState } from "react"
import useSWR from "swr/immutable"

import * as api from "~util/api"
import type * as types from "~util/types"

export const ProfileData = () => {
    const [profile, setProfile] = useState<types.Profile>()
    const { error, isLoading } = useSWR("/api/v1/profile/", api.authGet, {
        onSuccess: (data: types.Profile, key, config) => {
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
        <>
            <p>Date joined: {profile?.user.date_joined.toString()}</p>
            <p>Reecon username: {profile?.user.username}</p>
            <p>
                Reddit username:{" "}
                {profile?.reddit_username === null ? (
                    <a href={`https://old.reddit.com/message/compose?${linkAccountsArgs}`} target="_blank" rel="noopener noreferrer">
                        Link reddit username
                    </a>
                ) : (
                    <span>
                        {profile?.reddit_username}{" "}
                        <a href={`https://old.reddit.com/message/compose?${unlinkAccountsArgs}`} target="_blank" rel="noopener noreferrer">
                            Unlink reddit username
                        </a>
                    </span>
                )}
            </p>
        </>
    )
}
