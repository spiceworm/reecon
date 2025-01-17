import DataObjectIcon from "@mui/icons-material/DataObject"
import LaunchIcon from "@mui/icons-material/Launch"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import IconButton from "@mui/material/IconButton"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemIcon from "@mui/material/ListItemIcon"
import ListItemText from "@mui/material/ListItemText"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { MuiMarkdown } from "mui-markdown"
import { useRef, useState } from "react"
import useSWR from "swr"

import * as api from "~util/api"
import { CopyToClipboardButton, TooltipIcon } from "~util/components/mui"
import type * as types from "~util/types"

export const ContextQueryHistory = () => {
    const [redditorContextQueryHistory, setRedditorContextQueryHistory] = useState<types.RedditorContextQuery[]>([])
    const [threadContextQueryHistory, setThreadContextQueryHistory] = useState<types.ThreadContextQuery[]>([])

    const [redditorContextQueriesAreLoading, setRedditorContextQueriesAreLoading] = useState(false)
    const [threadContextQueriesAreLoading, setThreadContextQueriesAreLoading] = useState(false)
    const [shouldFetchHistory, setShouldFetchHistory] = useState(false)

    const [modalContent, setModalContent] = useState<types.RedditorContextQuery | types.ThreadContextQuery>(null)
    const [modalVisible, setModalVisible] = useState(false)
    const responseModalDescriptionElementRef = useRef<HTMLElement>(null)

    useSWR(shouldFetchHistory ? "/api/v1/reddit/redditor/context-query/" : null, api.authGet, {
        onSuccess: async (data: types.RedditorContextQuery[], key, config) => {
            setRedditorContextQueriesAreLoading(false)
            setShouldFetchHistory(false)
            setRedditorContextQueryHistory(data)
        }
    })

    useSWR(shouldFetchHistory ? "/api/v1/reddit/thread/context-query/" : null, api.authGet, {
        onSuccess: async (data: types.ThreadContextQuery[], key, config) => {
            setThreadContextQueriesAreLoading(false)
            setShouldFetchHistory(false)
            setThreadContextQueryHistory(data)
        }
    })

    const getQueryMetadata = (contextQuery: types.RedditorContextQuery | types.ThreadContextQuery) => {
        return {
            created: contextQuery?.created,
            inputs: contextQuery?.total_inputs,
            llm: contextQuery?.response.producer.name,
            submitter: contextQuery?.submitter.username
        }
    }

    const loadHistoryButtonHandler = async (e) => {
        setRedditorContextQueriesAreLoading(true)
        setThreadContextQueriesAreLoading(true)
        setShouldFetchHistory(true)
    }

    const showContextQueryClickHandler = async (contextQuery: types.RedditorContextQuery | types.ThreadContextQuery) => {
        setModalContent(contextQuery)
        setModalVisible(true)
    }

    const toggleModalVisibility = () => setModalVisible(!modalVisible)

    return (
        <Stack>
            <Button
                disabled={redditorContextQueriesAreLoading || threadContextQueriesAreLoading}
                onClick={loadHistoryButtonHandler}
                // loading={redditorContextQueriesAreLoading || threadContextQueriesAreLoading}
                // loadingPosition={"end"}
            >
                Load History
            </Button>

            <List>
                {[...redditorContextQueryHistory, ...threadContextQueryHistory]
                    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
                    .map((contextQuery, idx: number) => (
                        <ListItem
                            disablePadding={true}
                            key={`context-query-${idx}`}
                            secondaryAction={
                                <IconButton edge={"end"} href={contextQuery.context.source} target={"_blank"}>
                                    <LaunchIcon fontSize={"small"} />
                                </IconButton>
                            }>
                            <ListItemButton divider={true} onClick={() => showContextQueryClickHandler(contextQuery)}>
                                <ListItemIcon>
                                    <TooltipIcon
                                        icon={<DataObjectIcon fontSize={"small"} />}
                                        title={
                                            <Stack>
                                                {Object.entries(getQueryMetadata(contextQuery)).map(([key, value]) => (
                                                    <Typography key={key}>{`${key}: ${value}`}</Typography>
                                                ))}
                                            </Stack>
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary={contextQuery.prompt} />
                            </ListItemButton>
                        </ListItem>
                    ))}
            </List>

            <Dialog open={modalVisible} onClose={toggleModalVisibility}>
                <DialogContent dividers={true}>
                    <DialogContentText ref={responseModalDescriptionElementRef} tabIndex={-1}>
                        <Stack spacing={2}>
                            <Stack direction={"row"} spacing={2}>
                                <Typography variant={"h6"}>Prompt</Typography>
                                <CopyToClipboardButton text={modalContent?.prompt} />
                            </Stack>

                            <Typography>{modalContent?.prompt}</Typography>

                            <Stack direction={"row"} spacing={2}>
                                <Typography variant={"h6"}>Response</Typography>
                                <CopyToClipboardButton text={modalContent?.response.value} />
                                <TooltipIcon
                                    icon={<DataObjectIcon fontSize={"small"} />}
                                    title={
                                        <Stack>
                                            {Object.entries(getQueryMetadata(modalContent)).map(([key, value]) => (
                                                <Typography key={key}>{`${key}: ${value}`}</Typography>
                                            ))}
                                        </Stack>
                                    }
                                />
                            </Stack>

                            <Typography>
                                <MuiMarkdown>{modalContent?.response.value}</MuiMarkdown>
                            </Typography>
                        </Stack>
                    </DialogContentText>
                </DialogContent>
            </Dialog>
        </Stack>
    )
}
