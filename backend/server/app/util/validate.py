import openai


__all__ = ('producer_settings',)


def _validate_openai_api_key(api_key: str):
    client = openai.OpenAI(api_key=api_key)
    try:
        client.models.list()
    except openai.AuthenticationError:
        return False
    else:
        return True


def _validate_api_key(producer_name: str, api_key: str):
    match producer_name:
        case 'openai':
            return _validate_openai_api_key(api_key)
        case _:
            raise NotImplementedError(producer_name)


def producer_settings(producer_name: str, api_key: str):
    return {
        "api_key": _validate_api_key(producer_name, api_key)
    }
