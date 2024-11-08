import * as storage from "~util/storage"
import type * as types from "~util/types"

const GET = "GET"
const POST = "POST"

const _apiRequest = async (urlPath: string, method: string, body: object = {}, sendAuthenticated = false): Promise<any> => {
    let headers = {
        Accept: "application/json",
        "Content-Type": "application/json"
    }
    let options = {
        method: method,
        headers: headers
    }

    if (sendAuthenticated) {
        const auth: types.Auth = await storage.getAuth()

        if (auth === null) {
            throw new Error(`User authentication missing. Cannot send authenticated ${method} request to ${urlPath}`)
        } else {
            headers["Authorization"] = `Bearer ${auth.access}`
        }
    }
    if (method.toUpperCase() !== GET) {
        options["body"] = JSON.stringify(body)
    }

    const response = await fetch(`${process.env.PLASMO_PUBLIC_BASE_URL}${urlPath}`, options)

    if (response.ok) {
        await storage.setExtensionStatusMessage("apiRequestError", false)
        return response.json()
    } else {
        console.error(response)
        const errorJson = await response.json()
        await storage.setExtensionStatusMessage("apiRequestError", true, `Error returned from API: ${errorJson.detail}`)
        throw new Error(JSON.stringify(errorJson))
    }
}

export const get = async (urlPath: string, sendAuthenticated: boolean = false): Promise<any> => {
    return _apiRequest(urlPath, GET, {}, sendAuthenticated)
}

export const authGet = async (urlPath: string): Promise<any> => {
    return get(urlPath, true)
}

export const post = async (urlPath: string, body: object, sendAuthenticated: boolean = false): Promise<any> => {
    return _apiRequest(urlPath, POST, body, sendAuthenticated)
}

export const authPost = async (urlPath: string, body: object): Promise<any> => {
    return post(urlPath, body, true)
}

export const updateApiStatusMessages = async (): Promise<void> => {
    try {
        const apiStatusMessages = await authGet("/api/v1/status/messages/")
        await storage.setApiStatusMessages(apiStatusMessages)
    } catch (error) {
        await storage.setApiStatusMessages([])
        throw error
    }
}
