import io

import markdown


def _unmark_element(element, stream=None):
    if stream is None:
        stream = io.StringIO()
    if element.text:
        stream.write(element.text)
    for sub in element:
        _unmark_element(sub, stream)
    if element.tail:
        stream.write(element.tail)
    return stream.getvalue()


# https://stackoverflow.com/a/54923798/4344185
def strip(text):
    markdown.Markdown.output_formats["plain"] = _unmark_element
    md = markdown.Markdown(output_format="plain")
    md.stripTopLevelTags = False
    return md.convert(text)
