import useSWR from "swr"
import {Spinner} from "reactstrap"

import * as api from "~util/api"
import * as base from "~popup/bases"


export const Status = () => {
    const {data, error, isLoading} = useSWR('/api/v1/status', api.get)

    if (isLoading) {
        return <Spinner/>
    }
    if (error) {
        return (
            <base.Authenticated>
                <p>{error.message}</p>
            </base.Authenticated>
        )
    }
    if (data) {
        if (data.messages.length === 0) {
            return (
                <base.Authenticated>
                    <p>No status messages</p>
                </base.Authenticated>
            )
        }
    }

    return (
        <base.Authenticated>
            {
                data.messages.map((message: string, idx: number) =>
                    <p key={`status-message-${idx}`}>{message}</p>
                )
            }
        </base.Authenticated>
    )
}
