import re


"""
pythex.org test string:

> This is quoted
and this is in the same quote as above

  > this is also quoted
and so is this

this is not quoted

this is just a string with a > symbol in it

>> this is a multilevel quote
and this continues the quote

    > this is indented 4 times (code block) so it does not match
and neither should this
"""
match_block_quotes = re.compile(r"(^\s{0,3}>\s?.*(\n(?!\n|\s{4}).*)*)", re.MULTILINE)
