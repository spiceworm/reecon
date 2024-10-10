import useSWR from "swr"
import {Spinner, Toast, ToastBody, ToastHeader} from "reactstrap"

import * as api from "~util/api"
import * as base from "~popup/bases"


export const Status = () => {
    const {data, error, isLoading} = useSWR('/api/v1/status', api.getJson)

    return (
        <base.Authenticated>
            {
                isLoading ? <Spinner/> :
                    error ? <p>{error.message}</p> :
                        data.messages.map((message: string, idx: number) =>
                            <Toast key={`toast-${idx}`}>
                                <ToastHeader key={`toastheader-${idx}`}>
                                    API Status Message
                                </ToastHeader>
                                <ToastBody key={`toastbody-${idx}`}>
                                    {message}
                                </ToastBody>
                            </Toast>
                        )
            }
        </base.Authenticated>
    )
}
