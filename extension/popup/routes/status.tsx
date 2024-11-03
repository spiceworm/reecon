import { Spinner } from "reactstrap"
import useSWR from "swr"

import * as base from "~popup/bases"
import * as api from "~util/api"

export const Status = () => {
  const { data, error, isLoading } = useSWR("/api/v1/status", api.get)

  if (isLoading) {
    return <Spinner />
  }
  if (error) {
    return (
      <base.Authenticated>
        <p>{error.message}</p>
      </base.Authenticated>
    )
  }
  if (data) {
    if (data.messages.length === 0) {
      return (
        <base.Authenticated>
          <p>No status messages</p>
        </base.Authenticated>
      )
    }
  }

  return (
    <base.Authenticated>
      {data.messages.map((message: string, idx: number) => (
        <p key={`status-message-${idx}`}>{message}</p>
      ))}
    </base.Authenticated>
  )
}
