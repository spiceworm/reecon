import textwrap

from django.conf import settings
from django.contrib.auth.models import User
from django.core import management
import praw


class Actions:
    DELETE_REECON_ACCOUNT = "delete-reecon-account"
    HELP = "help"
    LINK_REDDIT_USERNAME = "link-reddit-username"
    RESET_REECON_PASSWORD = "reset-reecon-password"
    UNLINK_REDDIT_USERNAME = "unlink-reddit-username"


def delete_reecon_account(*, username) -> str:
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return unsuccessful_action(f"User with username {username} does not exist")
    else:
        user.delete()
        return f"User with username {username} has been deleted"


def help_() -> str:
    return textwrap.dedent(
        """
        Send reecon-admin a message with any of the following actions in the subject field:
        \tdelete-reecon-account
        \t\tThis will delete your reecon account.

        \thelp
        \t\treecon-admin will send you a response containing this message.

        \tlink-reddit-username
        \t\tLink your Reddit username to your reecon account. Linking your reddit username is required for actions such as resetting your password.

        \treset-password
        \t\treecon-admin will send you a response containing link to reset your reecon password.

        \tlink-reddit-username
        \t\tUnlink your Reddit username from being associated with your reecon account.
        """
    )


def link_reddit_username(*, reddit_username: str, signed_reecon_username: str) -> str:
    reecon_username, *_ = signed_reecon_username.split(":", 1)

    try:
        user = User.objects.get(username=reecon_username)
    except User.DoesNotExist:
        return unsuccessful_action(f"No reecon account exists for {reecon_username}.")
    else:
        if user.profile.reddit_username:
            return unsuccessful_action(f"A reddit username is already linked to {reecon_username}.")
        elif user.profile.verify_signed_username(signed_reecon_username):
            user.profile.reddit_username = reddit_username
            user.profile.save()
            return f"Successfully linked reddit username {reddit_username} to reecon account for {reecon_username}."
        else:
            return unsuccessful_action(
                f"Unable to verify reecon username signature. Do not modify the body of the message sent to {settings.REDDIT_BOT_USERNAME}."
            )


def reset_reecon_password() -> str:
    return "Not implemented yet"


def unlink_reddit_username(*, reddit_username: str, signed_reecon_username: str) -> str:
    reecon_username, *_ = signed_reecon_username.split(":", 1)

    try:
        user = User.objects.get(username=reecon_username)
    except User.DoesNotExist:
        return unsuccessful_action(f"No reecon account exists for {reecon_username}.")
    else:
        if user.profile.reddit_username:
            if user.profile.verify_signed_username(signed_reecon_username):
                user.profile.reddit_username = None
                user.profile.save()
                return f"Successfully unlinked reddit username {reddit_username} from reecon account for {reecon_username}."
            else:
                return unsuccessful_action(
                    f"Unable to verify reecon username signature. Do not modify the body of the message sent to {settings.REDDIT_BOT_USERNAME}."
                )
        return unsuccessful_action(f"No reddit username is currently linked to {reecon_username}.")


def unsuccessful_action(message: str) -> str:
    return textwrap.dedent(
        f"""
        {message}

        {help_()}
        """
    )


class Command(management.base.BaseCommand):
    def handle(self, *args, **options):
        reddit_client = praw.Reddit(
            client_id=settings.REDDIT_BOT_CLIENT_ID,
            client_secret=settings.REDDIT_BOT_CLIENT_SECRET,
            ratelimit_seconds=settings.REDDIT_BOT_RATELIMIT_SECONDS,
            user_agent=settings.REDDIT_BOT_USER_AGENT,
            username=settings.REDDIT_BOT_USERNAME,
            password=settings.REDDIT_BOT_PASSWORD,
        )

        for message in reddit_client.inbox.stream():
            # Do not process messages that are thread comment responses.
            if not message.was_comment:
                match message.subject.lower().strip():
                    case Actions.DELETE_REECON_ACCOUNT:
                        response = delete_reecon_account(
                            username=message.author.name,
                        )
                    case Actions.HELP:
                        response = help_()
                    case Actions.LINK_REDDIT_USERNAME:
                        response = link_reddit_username(
                            reddit_username=message.author.name,
                            signed_reecon_username=message.body.strip(),
                        )
                    case Actions.RESET_REECON_PASSWORD:
                        response = reset_reecon_password()
                    case Actions.UNLINK_REDDIT_USERNAME:
                        response = unlink_reddit_username(
                            reddit_username=message.author.name,
                            signed_reecon_username=message.body.strip(),
                        )
                    case _:
                        response = unsuccessful_action(f"Unrecognized action: {message.subject}")

                message.reply(response)
                message.delete()
