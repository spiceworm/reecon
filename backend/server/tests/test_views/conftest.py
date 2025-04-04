import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from reecon.models import (
    IgnoredRedditor,
    LLM,
    LlmProvider,
    Profile,
    Redditor,
    RedditorContextQuery,
    RedditorData,
    RequestMetadata,
    StatusMessage,
    Thread,
    ThreadContextQuery,
    ThreadData,
    UnprocessableRedditor,
    UnprocessableRedditorContextQuery,
    UnprocessableThread,
    UnprocessableThreadContextQuery,
)


@pytest.fixture
def api_client():
    """
    Fixture to provide an API client for testing.
    """
    return APIClient()


@pytest.fixture
def auth_client(api_client, user_stub):
    """
    Fixture to provide an authenticated API client.
    """
    api_client.force_authenticate(user=user_stub)
    yield api_client


@pytest.fixture
def ignored_redditor_cls():
    def func(*, reason, username):
        return IgnoredRedditor.objects.create(
            reason=reason,
            username=username,
        )

    return func


@pytest.fixture
def ignored_redditor_stub(ignored_redditor_cls):
    return ignored_redditor_cls(
        reason="ignored-reason",
        username="ignored-redditor",
    )


@pytest.fixture
def llm_cls():
    def func(*, context_window, description, name, provider):
        return LLM.objects.create(
            context_window=context_window,
            description=description,
            name=name,
            provider=provider,
        )

    return func


@pytest.fixture
def llm_stub(llm_cls, llm_provider_stub):
    return llm_cls(
        context_window=4096,
        description="llm-description",
        name="llm-name",
        provider=llm_provider_stub,
    )


@pytest.fixture
def llm_provider_cls():
    def func(*, description, display_name, name):
        return LlmProvider.objects.create(
            description=description,
            display_name=display_name,
            name=name,
        )

    return func


@pytest.fixture
def llm_provider_stub(llm_provider_cls):
    return llm_provider_cls(
        description="llm-provider-description",
        display_name="llm-provider-display-name",
        name="llm-provider-name",
    )


@pytest.fixture
def profile_stub(user_stub):
    """
    Fixture to create a test profile.
    """
    obj, _ = Profile.objects.get_or_create(user=user_stub)
    return obj


@pytest.fixture
def redditor_cls(llm_stub, redditor_data_cls, request_metadata_cls, user_stub):
    def func(*, last_processed=None, username, with_data=False):
        redditor = Redditor.objects.create(
            last_processed=last_processed or timezone.now(),
            username=username,
        )

        if with_data:
            request_metadata = request_metadata_cls(
                contributor=user_stub,
                input_tokens=100,
                llm=llm_stub,
                output_tokens=200,
                submitter=user_stub,
                total_inputs=5,
                total_tokens=300,
            )
            redditor_data_cls(
                age=25,
                interests=["test-interests"],
                iq=100,
                redditor=redditor,
                request_meta=request_metadata,
                sentiment_polarity=0.5,
                sentiment_subjectivity=0.5,
                summary="test-summary",
            )

        return redditor

    return func


@pytest.fixture
def redditor_stub(redditor_cls):
    return redditor_cls(username="test-redditor")


@pytest.fixture
def redditor_context_query_cls():
    def func(*, context, prompt, request_meta, response):
        return RedditorContextQuery.objects.create(
            context=context,
            prompt=prompt,
            request_meta=request_meta,
            response=response,
        )

    return func


@pytest.fixture
def redditor_context_query_stub(redditor_context_query_cls, redditor_data_stub, request_metadata_stub):
    return redditor_context_query_cls(
        context=redditor_data_stub.redditor,
        prompt="test-prompt",
        request_meta=request_metadata_stub,
        response="test-response",
    )


@pytest.fixture
def redditor_data_cls():
    def func(*, age, interests, iq, redditor, request_meta, sentiment_polarity, sentiment_subjectivity, summary):
        return RedditorData.objects.create(
            age=age,
            interests=interests,
            iq=iq,
            redditor=redditor,
            request_meta=request_meta,
            sentiment_polarity=sentiment_polarity,
            sentiment_subjectivity=sentiment_subjectivity,
            summary=summary,
        )

    return func


@pytest.fixture
def redditor_data_stub(redditor_data_cls, redditor_stub, request_metadata_stub):
    return redditor_data_cls(
        age=25,
        interests=["test-interests"],
        iq=100,
        redditor=redditor_stub,
        request_meta=request_metadata_stub,
        sentiment_polarity=0.5,
        sentiment_subjectivity=0.5,
        summary="test-summary",
    )


@pytest.fixture
def request_metadata_cls():
    def func(*, contributor, input_tokens, llm, output_tokens, submitter, total_inputs, total_tokens):
        return RequestMetadata.objects.create(
            contributor=contributor,
            input_tokens=input_tokens,
            llm=llm,
            output_tokens=output_tokens,
            submitter=submitter,
            total_inputs=total_inputs,
            total_tokens=total_tokens,
        )

    return func


@pytest.fixture
def request_metadata_stub(llm_stub, request_metadata_cls, user_stub):
    return request_metadata_cls(
        contributor=user_stub,
        input_tokens=100,
        llm=llm_stub,
        output_tokens=200,
        submitter=user_stub,
        total_inputs=5,
        total_tokens=300,
    )


@pytest.fixture
def status_message_cls():
    def func(*, active, active_is_computed, category, message, name, source):
        return StatusMessage.objects.create(
            active=active,
            active_is_computed=active_is_computed,
            category=category,
            message=message,
            name=name,
            source=source,
        )

    return func


@pytest.fixture
def thread_cls(llm_stub, thread_data_cls, request_metadata_cls, user_stub):
    def func(*, last_processed=None, path, with_data=False):
        thread = Thread.objects.create(
            last_processed=last_processed or timezone.now(),
            path=path,
        )

        if with_data:
            request_metadata = request_metadata_cls(
                contributor=user_stub,
                input_tokens=100,
                llm=llm_stub,
                output_tokens=200,
                submitter=user_stub,
                total_inputs=5,
                total_tokens=300,
            )
            thread_data_cls(
                keywords=["test-keyword"],
                thread=thread,
                request_meta=request_metadata,
                sentiment_polarity=0.5,
                sentiment_subjectivity=0.5,
                summary="test-summary",
            )

        return thread

    return func


@pytest.fixture
def thread_stub(thread_cls):
    return thread_cls(path="/r/test/comments/asdf")


@pytest.fixture
def thread_context_query_cls():
    def func(*, context, prompt, request_meta, response):
        return ThreadContextQuery.objects.create(
            context=context,
            prompt=prompt,
            request_meta=request_meta,
            response=response,
        )

    return func


@pytest.fixture
def thread_context_query_stub(thread_context_query_cls, thread_data_stub, request_metadata_stub):
    return thread_context_query_cls(
        context=thread_data_stub.thread,
        prompt="test-prompt",
        request_meta=request_metadata_stub,
        response="test-response",
    )


@pytest.fixture
def thread_data_cls():
    def func(*, keywords, request_meta, sentiment_polarity, sentiment_subjectivity, summary, thread):
        return ThreadData.objects.create(
            keywords=keywords,
            request_meta=request_meta,
            sentiment_polarity=sentiment_polarity,
            sentiment_subjectivity=sentiment_subjectivity,
            summary=summary,
            thread=thread,
        )

    return func


@pytest.fixture
def thread_data_stub(thread_data_cls, request_metadata_stub, thread_stub):
    return thread_data_cls(
        keywords=["test-keyword"],
        request_meta=request_metadata_stub,
        sentiment_polarity=0.5,
        sentiment_subjectivity=0.5,
        summary="test-summary",
        thread=thread_stub,
    )


@pytest.fixture
def unprocessable_redditor_cls():
    def func(*, reason, username):
        return UnprocessableRedditor.objects.create(
            reason=reason,
            username=username,
        )

    return func


@pytest.fixture
def unprocessable_redditor_stub(unprocessable_redditor_cls):
    return unprocessable_redditor_cls(
        reason="test-reason",
        username="test-username",
    )


@pytest.fixture
def unprocessable_redditor_context_query_cls():
    def func(*, reason, username):
        return UnprocessableRedditorContextQuery.objects.create(
            reason=reason,
            username=username,
        )

    return func


@pytest.fixture
def unprocessable_redditor_context_query_stub(unprocessable_redditor_context_query_cls, redditor_stub):
    return unprocessable_redditor_context_query_cls(
        reason="test-reason",
        username=redditor_stub.username,
    )


@pytest.fixture
def unprocessable_thread_context_query_cls():
    def func(*, path, reason):
        return UnprocessableThreadContextQuery.objects.create(
            path=path,
            reason=reason,
        )

    return func


@pytest.fixture
def unprocessable_thread_context_query_stub(unprocessable_thread_context_query_cls, thread_stub):
    return unprocessable_thread_context_query_cls(
        path=thread_stub.path,
        reason="test-reason",
    )


@pytest.fixture
def unprocessable_thread_cls():
    def func(*, path, reason):
        return UnprocessableThread.objects.create(
            path=path,
            reason=reason,
        )

    return func


@pytest.fixture
def unprocessable_thread_stub(unprocessable_thread_cls):
    return unprocessable_thread_cls(
        path="/r/test/comments/asdf",
        reason="test-reason",
    )


@pytest.fixture
def user_cls(django_user_model):
    def func(*, password, username):
        return django_user_model.objects.create_user(
            password=password,
            username=username,
        )

    return func


@pytest.fixture
def user_stub(user_cls):
    """
    Fixture to create a test user.
    """
    return user_cls(password="password", username="testuser")
