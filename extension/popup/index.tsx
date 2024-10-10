import 'bootstrap/dist/css/bootstrap.min.css'
import {MemoryRouter, Route, Routes} from "react-router-dom"

import {Settings} from "~popup/routes/settings"
import {Status} from "~popup/routes/status"
import {Login} from "~popup/routes/auth/login"
import {Signup} from "~popup/routes/auth/signup"


function IndexPopup() {
    return (
        <MemoryRouter>
            <Routes>
                <Route path="/" element={<Settings/>}/>
                <Route path="/settings" element={<Settings/>}/>
                <Route path="/auth/login" element={<Login/>}/>
                <Route path="/auth/signup" element={<Signup/>}/>
                <Route path="/status" element={<Status/>}/>
            </Routes>
        </MemoryRouter>
    )
}

export default IndexPopup
