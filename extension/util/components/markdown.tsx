import { marked } from "marked"

export const Markdown = ({ children }) => {
    const markdown = marked.parse(children)
    return <div dangerouslySetInnerHTML={{ __html: markdown }} />
}
