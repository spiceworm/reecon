import json
import logging
import os
import readline
from typing import List

from constance import config
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import management
import pydantic.json

from ... import (
    models,
    schemas,
    services,
)


log = logging.getLogger()


def input_with_default(prompt, default=""):
    """
    Prompt the user with an optional editable default value.
    """
    readline.set_startup_hook(lambda: readline.insert_text(default))
    try:
        return input(prompt)
    finally:
        readline.set_startup_hook()


class Command(management.base.BaseCommand):
    def add_arguments(self, parser):
        entity_sp = parser.add_subparsers(dest="entity", required=True)

        redditor_sp = entity_sp.add_parser("redditor")
        redditor_group = redditor_sp.add_argument_group("redditor-group")
        redditor_group.add_argument("username")

        thread_sp = entity_sp.add_parser("thread")
        thread_group = thread_sp.add_argument_group("thread-group")
        thread_group.add_argument("url")

        for entity_sp in (redditor_sp, thread_sp):
            service_sp = entity_sp.add_subparsers(dest="service", required=True)

            context_query_sp = service_sp.add_parser("context-query")
            data_sp = service_sp.add_parser("data")

            for service_p in (context_query_sp, data_sp):
                method_sp = service_p.add_subparsers(dest="method", required=True)

                create_object_sp = method_sp.add_parser("create-object")
                generate_sp = method_sp.add_parser("generate")
                get_inputs_sp = method_sp.add_parser("get-inputs")

                for method_p in (create_object_sp, generate_sp, get_inputs_sp):
                    method_p.add_argument("--debug", action="store_true")

                    method_p.add_argument(
                        "--llm",
                        choices=models.LLM.objects.values_list("name", flat=True),
                        default=config.LLM_NAME,
                    )

    def echo(self, s):
        self.stdout.write(s, ending="\n\r")
        self.stdout.flush()

    def echos(self, lst):
        terminal_size = os.get_terminal_size()
        terminal_width = terminal_size.columns
        for obj in lst:
            s = json.dumps(obj, default=pydantic.json.pydantic_encoder)
            self.echo("-" * terminal_width)
            self.echo(s)

    def handle(self, *args, **options):
        if options["debug"]:
            log.setLevel("DEBUG")
        else:
            log.setLevel("INFO")

        llm = models.LLM.objects.get(name=options["llm"])
        admin = get_user_model().objects.get(username="admin")
        env = schemas.get_worker_env()

        prompt = ""

        if options["entity"] == "redditor":
            identifier = options["username"]

            if options["service"] == "context-query":
                reddit_service_cls = services.RedditorContextQueryService
                if options["method"] in ("generate", "create-object"):
                    prompt = input_with_default("prompt: ", env.redditor.llm.prompts.process_context_query)
            else:
                prompt = env.redditor.llm.prompts.process_data
                reddit_service_cls = services.RedditorDataService
        else:
            identifier = options["url"]

            if options["service"] == "context-query":
                reddit_service_cls = services.ThreadContextQueryService
                if options["method"] in ("generate", "create-object"):
                    prompt = input_with_default("prompt: ", env.thread.llm.prompts.process_context_query)
            else:
                prompt = env.thread.llm.prompts.process_data
                reddit_service_cls = services.ThreadDataService

        service = reddit_service_cls(
            identifier=identifier,
            contributor=admin,
            llm=llm,
            llm_providers_settings=settings.DEFAULT_LLM_PROVIDERS_SETTINGS,
            submitter=admin,
            env=env,
        )

        inputs: List[schemas.LlmInput] = service.get_inputs()

        log.debug(
            "Retrieved %s inputs for %s",
            len(inputs),
            service.identifier,
        )

        if options["method"] == "get-inputs":
            self.echos(inputs)
            return

        generated = service.generate(inputs=inputs, prompt=prompt)

        if options["method"] == "generate":
            self.echo(generated.model_dump_json(indent=4, exclude={"inputs", "prompt"}))
            return

        log.debug("Generated data = %s", generated.model_dump())
        obj = service.create_object(generated=generated)

        if options["method"] == "create-object":
            self.echo(str(obj))
