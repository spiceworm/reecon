import pytest


@pytest.mark.django_db
class TestLlmProvider:
    def test_create(self, llm_provider_cls):
        ll_provider = llm_provider_cls(description="desc", display_name="Test Provider", name="test_provider")
        assert ll_provider.description == "desc"
        assert ll_provider.display_name == "Test Provider"
        assert ll_provider.name == "test_provider"

    def test_str(self, llm_provider_cls):
        ll_provider = llm_provider_cls(description="desc", display_name="Test Provider", name="test_provider")
        expected_str = f"LlmProvider(description={ll_provider.description}, display_name={ll_provider.display_name}, name={ll_provider.name})"
        assert str(ll_provider) == expected_str


@pytest.mark.django_db
class TestLLM:
    def test_create(self, llm_cls, llm_provider_stub):
        llm = llm_cls(context_window=2048, description="llm-desc", name="test_llm", provider=llm_provider_stub)
        assert llm.context_window == 2048
        assert llm.description == "llm-desc"
        assert llm.name == "test_llm"
        assert llm.provider is llm_provider_stub
        assert list(llm.provider.llms.all()) == [llm]

    def test_str(self, llm_cls, llm_provider_stub):
        llm = llm_cls(context_window=2048, description="llm-desc", name="test_llm", provider=llm_provider_stub)
        expected_str = f"LLM(context_window={llm.context_window}, description={llm.description}, name={llm.name}, provider={llm.provider.name})"
        assert str(llm) == expected_str


@pytest.mark.django_db
class TestRequestMetadata:
    def test_create(self, llm_stub, request_metadata_cls, user_stub):
        request_meta = request_metadata_cls(contributor=user_stub, input_tokens=100, llm=llm_stub, output_tokens=200, submitter=user_stub, total_inputs=5, total_tokens=300)
        assert request_meta.contributor is user_stub
        assert request_meta.input_tokens == 100
        assert request_meta.llm is llm_stub
        assert request_meta.output_tokens == 200
        assert request_meta.submitter is user_stub
        assert request_meta.total_inputs == 5
        assert request_meta.total_tokens == 300
        assert list(request_meta.contributor.contributions.all()) == [request_meta]
        assert list(request_meta.llm.requests_metadata.all()) == [request_meta]
        assert list(request_meta.submitter.submissions.all()) == [request_meta]

    def test_str(self, llm_stub, request_metadata_cls, user_stub):
        request_meta = request_metadata_cls(contributor=user_stub, input_tokens=100, llm=llm_stub, output_tokens=200, submitter=user_stub, total_inputs=5, total_tokens=300)
        expected_str = f"RequestMetadata(contributor={request_meta.contributor.username}, input_tokens={request_meta.input_tokens}, llm={request_meta.llm.name}, output_tokens={request_meta.output_tokens}, submitter={request_meta.submitter.username}, total_inputs={request_meta.total_inputs}, total_tokens={request_meta.total_tokens})"
        assert str(request_meta) == expected_str
