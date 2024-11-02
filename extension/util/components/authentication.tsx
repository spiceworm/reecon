import {Navigate} from "react-router-dom"
import {useStorage} from "@plasmohq/storage/dist/hook"

import * as storage from "~util/storage"


export const RequireAuthentication = ({children}) => {
    const [auth, _] = useStorage({instance: storage.localStorage, key: storage.AUTH})

    // Storage still loading value
    if (auth === undefined) {
        return null
    }

    // Value loaded from storage but user is not logged in
    if (auth === null) {
        return <Navigate to="/auth/login" replace/>
    }

    return children
}
