import { jwtDecode } from "jwt-decode";


export function apiAuthRequest(urlPath, type, accessToken, body) {
    return fetch(`${process.env.BASE_URL}${urlPath}`, {
            method: type,
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        }
    )
}


export function apiRequest(urlPath, type, body) {
    return fetch(`${process.env.BASE_URL}${urlPath}`, {
            method: type,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        }
    )
}


export function jwtIsValid(token) {
    if (token === null) {
        return false;
    } else {
        const jwt = jwtDecode(token);
        return Date.now() < jwt.exp * 1000;
    }
}


export async function getAccessToken() {
    return browser.storage.local.get(['accessToken', 'refreshToken']).then(settings => {
        if (jwtIsValid(settings.accessToken)) {
            return settings.accessToken;
        } else if (jwtIsValid(settings.refreshToken)) {
            return apiRequest(
                '/api/v1/auth/token/refresh/',
                'post',
                {
                    'refresh': settings.refreshToken,
                }
            ).then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(response)
                }
            }).then(refreshJson => {
                return browser.storage.local.set({accessToken: refreshJson.access}).then(() => {
                    return refreshJson.access;
                });
            }).catch(error => {
                console.log(error);
            })
        } else {
            return browser.storage.local.set({accessToken: null, refreshToken: null}).then(() => {
                return null;
            });
        }
    })
}

export async function getApiStatus() {
    return apiRequest(
        '/api/v1/status/',
        'get',
    ).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(response)
        }
    })
}
