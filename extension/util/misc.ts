import { jwtDecode } from "jwt-decode"

export const jwtIsValid = (token: string | null) => {
    if (token === null) {
        return false
    } else {
        // Check if the JWT is expired
        const jwt = jwtDecode(token)
        return Date.now() < jwt.exp * 1000
    }
}
