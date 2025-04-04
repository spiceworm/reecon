import pytest

from reecon import util


@pytest.mark.parametrize(
    "md, expected",
    [
        ("_italic_", "italic"),
        ("*italic*", "italic"),
        ("__bold__", "bold"),
        ("**bold**", "bold"),
        ("___bold-italic___", "bold-italic"),
        ("***bold-italic***", "bold-italic"),
        ("`code`", "code"),
        ("[link](https://redditinc.com)", "link"),
        ("# Heading 1", "Heading 1"),
        ("## Heading 2", "Heading 2"),
        ("- a\n- b\n  1. c\n  2. d", "a\nb\nc\nd"),
        ("> Blockquote\nnew line in quote", "Blockquote\nnew line in quote"),
    ],
)
def test_strip(md, expected):
    assert util.markdown.strip(md) == expected
