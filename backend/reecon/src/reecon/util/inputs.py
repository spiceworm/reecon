from typing import Tuple

from . import (
    markdown,
    regex,
)


def sanitize(s: str, *, max_length: int, min_length: int, disallowed_strings: Tuple[str] = ()) -> str:
    if not s or s in disallowed_strings:
        return ""

    # Remove block quotes as they are someone else's words. We do not want them included in the responder's submissions.
    text = regex.match_block_quotes.sub("", s)
    text = markdown.strip(text)
    text = " ".join(line.strip() for line in text.splitlines())

    text_len = len(text)
    if text_len < min_length or text_len > max_length:
        text = ""

    return text.strip()
