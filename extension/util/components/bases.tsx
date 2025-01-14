import { Container } from "reactstrap"

export const Base = ({ children }) => {
    return (
        <Container className={"p-3"} fluid={true}>
            {children}
        </Container>
    )
}
