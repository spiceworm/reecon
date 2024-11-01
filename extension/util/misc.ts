import {jwtDecode} from "jwt-decode";


export const getMillisecondsUntilJwtExp = (token: string) => {
    const jwt = jwtDecode(token)
    const millisecondsUntilExpired = (jwt.exp * 1000) - Date.now()
    return millisecondsUntilExpired <= 0 ? 0 : millisecondsUntilExpired
}


export const jwtIsValid = (token: string | null) => {
    if (token === null) {
        return false;
    } else {
        // Check if the JWT is expired
        const jwt = jwtDecode(token);
        return Date.now() < jwt.exp * 1000;
    }
}
