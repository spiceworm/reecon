import pytest

from reecon import util


@pytest.mark.parametrize(
    "s, expected",
    [
        (">Blockquote", ""),
        ("> Blockquote", ""),
        ("    > Codeblock", "    > Codeblock"),
        ("> Blockquote\nand this is in the same blockquote", ""),
        ("> Blockquote\n\n> This is another quote", "\n"),
        ("> Blockquote\n  > This is also quoted", ""),
        ("> Blockquote\n\nThis is not quoted", "\n\nThis is not quoted"),
        ("> Blockquote\n>> This is a multilevel quote", ""),
        ("> Blockquote\n\n    > This is indented 4 times (code block) so it does not match", "\n\n    > This is indented 4 times (code block) so it does not match"),
        ("> Blockquote\n\nThis is just a string with a > symbol in it\n> Another blockquote", "\n\nThis is just a string with a > symbol in it\n"),
    ],
)
def test_match_block_quotes(s, expected):
    assert util.regex.match_block_quotes.sub("", s) == expected
