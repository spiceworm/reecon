import Button from "@mui/material/Button"
import Checkbox from "@mui/material/Checkbox"
import FormControlLabel from "@mui/material/FormControlLabel"
import Stack from "@mui/material/Stack"
import Grid from "@mui/material/Unstable_Grid2"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as navigation from "~popup/navigation"
import * as bases from "~util/components/bases"
import { CommentFilterTable, ThreadFilterTable } from "~util/components/filterTable/tables"
import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const ActiveSettingsView = () => {
    const [activeCommentFilter] = useStorage<types.CommentFilter>(
        {
            instance: storage.extLocalStorage,
            key: constants.ACTIVE_COMMENT_FILTER
        },
        (v) => (v === undefined ? constants.defaultCommentFilter : v)
    )
    const [activeThreadFilter] = useStorage<types.ThreadFilter>(
        {
            instance: storage.extLocalStorage,
            key: constants.ACTIVE_THREAD_FILTER
        },
        (v) => (v === undefined ? constants.defaultThreadFilter : v)
    )
    const [disableExtension, setDisableExtension] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.DISABLE_EXTENSION },
        (v) => (v === undefined ? false : v)
    )
    const [hideIgnoredRedditors, setHideIgnoredRedditors] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.HIDE_IGNORED_REDDITORS_ENABLED },
        (v) => (v === undefined ? false : v)
    )
    const [hideUnprocessableRedditors, setHideUnprocessableRedditors] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.HIDE_UNPROCESSABLE_REDDITORS_ENABLED },
        (v) => (v === undefined ? false : v)
    )
    const [hideUnprocessableThreads, setHideUnprocessableThreads] = useStorage<boolean>(
        { instance: storage.extLocalStorage, key: constants.HIDE_UNPROCESSABLE_THREADS_ENABLED },
        (v) => (v === undefined ? false : v)
    )

    const handleAllSettingsBtnClick = async (e) => {
        await chrome.tabs.create({ url: "/tabs/index.html" })
    }

    return (
        <bases.Base>
            <Stack>
                <navigation.PopupNavigation />

                <Stack spacing={2}>
                    <Grid container>
                        <Grid xs={6} sm={6} md={6} lg={6} xl={6}>
                            <FormControlLabel
                                control={<Checkbox checked={disableExtension} onChange={(e) => setDisableExtension(e.target.checked)} />}
                                label={"Disable reecon"}
                            />
                        </Grid>
                        <Grid xs={6} sm={6} md={6} lg={6} xl={6}>
                            <FormControlLabel
                                control={<Checkbox checked={hideIgnoredRedditors} onChange={(e) => setHideIgnoredRedditors(e.target.checked)} />}
                                label={"Hide ignored redditors"}
                            />
                        </Grid>
                        <Grid xs={6} sm={6} md={6} lg={6} xl={6}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={hideUnprocessableRedditors}
                                        onChange={(e) => setHideUnprocessableRedditors(e.target.checked)}
                                    />
                                }
                                label={"Hide unprocessable redditors"}
                            />
                        </Grid>
                        <Grid xs={6} sm={6} md={6} lg={6} xl={6}>
                            <FormControlLabel
                                control={
                                    <Checkbox checked={hideUnprocessableThreads} onChange={(e) => setHideUnprocessableThreads(e.target.checked)} />
                                }
                                label={"Hide unprocessable threads"}
                            />
                        </Grid>
                    </Grid>

                    <ThreadFilterTable
                        columnFilters={[
                            {
                                id: "context",
                                value: activeThreadFilter.context
                            }
                        ]}
                        columnVisibility={{
                            context: true,
                            sentimentPolarity: true,
                            sentimentSubjectivity: true,
                            action: true
                        }}
                        footerVisible={false}
                        headerControlsVisible={true}
                    />
                    <CommentFilterTable
                        columnFilters={[
                            {
                                id: "context",
                                value: activeCommentFilter.context
                            }
                        ]}
                        columnVisibility={{
                            context: true,
                            age: true,
                            iq: true,
                            sentimentPolarity: true,
                            sentimentSubjectivity: true,
                            action: true
                        }}
                        footerVisible={false}
                        headerControlsVisible={true}
                    />

                    <Stack alignItems="center" display="flex" justifyContent="center">
                        <Button color={"primary"} onClick={handleAllSettingsBtnClick}>
                            More
                        </Button>
                    </Stack>
                </Stack>
            </Stack>
        </bases.Base>
    )
}
