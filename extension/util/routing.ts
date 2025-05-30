import { matchPath, useLocation } from "react-router-dom"

// https://v5.mui.com/material-ui/integrations/routing/#tabs
export const useRouteMatch = (patterns: readonly string[]) => {
    const { pathname } = useLocation()

    for (let i = 0; i < patterns.length; i += 1) {
        const pattern = patterns[i]
        const possibleMatch = matchPath(pattern, pathname)
        if (possibleMatch !== null) {
            return possibleMatch
        }
    }

    return null
}
