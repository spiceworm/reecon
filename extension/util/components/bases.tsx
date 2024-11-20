import { Container } from "reactstrap"

export const Unauthenticated = ({ children }) => {
    return (
        <Container className={"p-3"} fluid={true}>
            {children}
        </Container>
    )
}
