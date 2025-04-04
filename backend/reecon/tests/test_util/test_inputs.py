import pytest


from reecon import util


@pytest.mark.parametrize(
    "s, max_length, min_length, expected",
    [
        ("This is a test string.", 50, 5, "This is a test string."),
        ("> Blockquote", 50, 1, ""),
        ("> Blockquote\n\nThis is not in the blockquote.", 50, 5, "This is not in the blockquote."),
        ("__This__ is a test string.", 50, 5, "This is a test string."),
        ("   This\n  is \n  a  \n test  \n string.\n", 50, 5, "This is a test string."),
        ("This is a test string.", 10, 5, ""),
        ("This is a test string.", 50, 25, ""),
        ("", 50, 5, ""),
    ],
)
def test_sanitize(s, max_length, min_length, expected):
    assert util.inputs.sanitize(s, max_length=max_length, min_length=min_length) == expected
