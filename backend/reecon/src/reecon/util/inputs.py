from . import (
    markdown,
    regex,
)


def sanitize(s: str, *, max_length: int, min_length: int) -> str:
    if not s:
        return ""

    # Remove block quotes as they are someone else's words. We do not want them included in the responder's submissions.
    text = regex.match_block_quotes.sub("", s)
    text = markdown.strip(text)
    text = " ".join(line.strip() for line in text.splitlines())
    text = text.strip()

    text_len = len(text)
    if text_len < min_length or text_len > max_length:
        text = ""

    return text
