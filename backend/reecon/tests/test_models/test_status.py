import pytest


@pytest.mark.django_db
class TestStatusMessage:
    def test_create(self, status_message_cls):
        obj = status_message_cls(active=True, active_is_computed=False, category="info", message="This is a test message.", name="TestMessage", source="api")
        assert obj.active is True
        assert obj.active_is_computed is False
        assert obj.category == "info"
        assert obj.message == "This is a test message."
        assert obj.name == "TestMessage"
        assert obj.source == "api"

    def test_str(self, status_message_cls):
        obj = status_message_cls(active=True, active_is_computed=False, category="info", message="This is a test message.", name="TestMessage", source="api")
        expected_str = f"StatusMessage(active={obj.active}, category={obj.category}, message={obj.message}, name={obj.name}, source={obj.source})"
        assert str(obj) == expected_str
