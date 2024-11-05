import { Alert, Spinner, Toast, ToastBody, ToastHeader } from "reactstrap"
import useSWR from "swr"

import { useStorage } from "@plasmohq/storage/dist/hook"

import * as base from "~popup/bases"
import * as api from "~util/api"
import * as constants from "~util/constants"
import * as storage from "~util/storage"
import type * as types from "~util/types"

export const Status = () => {
  const {
    data: apiStatus,
    error,
    isLoading
  } = useSWR("/api/v1/status", api.get)

  const [localStatusMessages] = useStorage(
    { instance: storage.localStorage, key: constants.LOCAL_STATUS_MESSAGES },
    (v: types.StatusMessage[]) => (v === undefined ? [] : v)
  )

  if (isLoading) {
    return (
      <base.Authenticated>
        <Spinner />
      </base.Authenticated>
    )
  }
  if (error) {
    return (
      <base.Authenticated>
        <Alert color={"danger"}>{error.message}</Alert>
      </base.Authenticated>
    )
  }

  let messages: types.StatusMessage[] = localStatusMessages
    .filter((message) => message.active)
    .concat(
      apiStatus.messages.filter(
        (message: types.StatusMessage) => message.active
      )
    )

  return (
    <base.Authenticated>
      {messages.length === 0 ? (
        <Alert color={"light"}>No status messages</Alert>
      ) : (
        messages.map((message, idx: number) => (
          <div className={"p-1"}>
            <Toast key={`status-message-${idx}`}>
              <ToastHeader icon={message.category}>
                Source: {message.source}
              </ToastHeader>
              <ToastBody>{message.message}</ToastBody>
            </Toast>
          </div>
        ))
      )}
    </base.Authenticated>
  )
}
