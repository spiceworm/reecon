import pytest

from reecon import util


@pytest.mark.django_db
def test_get_llm_choices(llm_cls, llm_provider_stub):
    llm1 = llm_cls(
        context_window=4096,
        description="llm-description-1",
        name="llm-name-1",
        provider=llm_provider_stub,
    )
    llm2 = llm_cls(
        context_window=4096,
        description="llm-description-2",
        name="llm-name-2",
        provider=llm_provider_stub,
    )
    choices = util.fields.get_llm_choices()
    assert choices == [(name, name) for name in [llm1.name, llm2.name]]
