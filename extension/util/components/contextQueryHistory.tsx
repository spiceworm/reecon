import { useState } from "react"
import { BoxArrowUpRight } from "react-bootstrap-icons"
import {
    Button,
    Col,
    ListGroup,
    ListGroupItem,
    ListGroupItemHeading,
    ListGroupItemText,
    Modal,
    ModalBody,
    ModalHeader,
    Row,
    Spinner
} from "reactstrap"
import useSWR from "swr"

import * as api from "~util/api"
import type * as types from "~util/types"

export const ContextQueryHistory = () => {
    const [redditorContextQueryHistory, setRedditorContextQueryHistory] = useState([])
    const [threadContextQueryHistory, setThreadContextQueryHistory] = useState([])

    const [redditorContextQueriesAreLoading, setRedditorContextQueriesAreLoading] = useState(false)
    const [threadContextQueriesAreLoading, setThreadContextQueriesAreLoading] = useState(false)
    const [shouldFetchHistory, setShouldFetchHistory] = useState(false)

    const [modalHeaderText, setModalHeaderText] = useState("")
    const [modalHeaderTitle, setModalHeaderTitle] = useState("")
    const [modalBodyLines, setModalBodyLines] = useState([])
    const [modalVisible, setModalVisible] = useState(false)

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

    const loadHistoryButtonHandler = async (e) => {
        setRedditorContextQueriesAreLoading(true)
        setThreadContextQueriesAreLoading(true)
        setShouldFetchHistory(true)
    }

    const showContextQueryClickHandler = async (contextQuery: types.RedditorContextQuery | types.ThreadContextQuery) => {
        setModalHeaderText(contextQuery.context.identifier)

        setModalHeaderTitle(
            [
                `Created: ${contextQuery.created}`,
                `Inputs: ${contextQuery.total_inputs}`,
                `Submitter: ${contextQuery.submitter.username}`,
                `Response LLM: ${contextQuery.response.producer.name}`
            ].join("\u000d")
        )

        setModalBodyLines([contextQuery.prompt, contextQuery.response.value])
        setModalVisible(true)
    }

    const toggleModalVisibility = () => setModalVisible(!modalVisible)

    return (
        <>
            <Row>
                <Col>
                    <hr />
                </Col>
            </Row>
            <Row>
                <Col className={"d-flex justify-content-center"}>
                    <Button color={"link"} onClick={loadHistoryButtonHandler}>
                        Load History
                    </Button>
                    {redditorContextQueriesAreLoading || threadContextQueriesAreLoading ? <Spinner /> : null}
                </Col>
            </Row>
            <Row>
                <ListGroup>
                    {redditorContextQueriesAreLoading || threadContextQueriesAreLoading
                        ? null
                        : redditorContextQueryHistory
                              .concat(threadContextQueryHistory)
                              .sort(
                                  (
                                      a: types.RedditorContextQuery | types.ThreadContextQuery,
                                      b: types.RedditorContextQuery | types.ThreadContextQuery
                                  ) => new Date(b.created).getTime() - new Date(a.created).getTime()
                              )
                              .map((contextQuery: types.RedditorContextQuery | types.ThreadContextQuery, idx: number) => (
                                  <ListGroupItem
                                      action
                                      href={"#"}
                                      tag={"a"}
                                      key={`context-query-${idx}`}
                                      onClick={() => showContextQueryClickHandler(contextQuery)}>
                                      <ListGroupItemHeading>
                                          <Button color={"link"} href={contextQuery.context.source} size={"sm"} target={"_blank"}>
                                              <BoxArrowUpRight />
                                          </Button>{" "}
                                          {contextQuery.context.identifier}
                                      </ListGroupItemHeading>

                                      <ListGroupItemText>{contextQuery.prompt}</ListGroupItemText>
                                  </ListGroupItem>
                              ))}
                </ListGroup>
            </Row>

            <Modal isOpen={modalVisible} size={"xl"} toggle={toggleModalVisibility}>
                <ModalHeader toggle={toggleModalVisibility} title={modalHeaderTitle}>
                    {modalHeaderText}
                </ModalHeader>
                <ModalBody>
                    {modalBodyLines.map((line: string, idx: number) => (
                        <>
                            {idx !== 0 ? <br /> : null}
                            <p key={idx}>{line}</p>
                        </>
                    ))}
                </ModalBody>
            </Modal>
        </>
    )
}
