import Box from "@mui/material/Box"
import Container from "@mui/material/Container"
import CssBaseline from "@mui/material/CssBaseline"
import { ThemeProvider } from "@mui/material/styles"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as constants from "~/util/constants"
import { UIThemes } from "~util/components/mui"
import * as storage from "~util/storage"

export const Base = ({ children }) => {
    const [theme] = useStorage<string>(
        {
            instance: storage.extLocalStorage,
            key: constants.UI_THEME
        },
        (v) => (v === undefined ? constants.DEFAULT_UI_THEME : v)
    )

    return (
        <ThemeProvider theme={UIThemes[theme]}>
            <CssBaseline />
            <Container sx={{ minWidth: 700 }}>
                <Box m={2}>{children}</Box>
            </Container>
        </ThemeProvider>
    )
}
