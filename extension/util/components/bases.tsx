import { Box, Container, createTheme, CssBaseline, ThemeProvider } from "@mui/material"

const darkTheme = createTheme({
    palette: {
        mode: "light"
    }
})

export const Base = ({ children }) => {
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Container sx={{ minWidth: 700 }}>
                <Box m={2}>{children}</Box>
            </Container>
        </ThemeProvider>
    )
}
