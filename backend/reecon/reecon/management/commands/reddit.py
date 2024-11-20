import logging
import os
from typing import List

from constance import config
from django.conf import settings
from django.contrib.auth.models import User
from django.core import management
import tiktoken

from ... import (
    models,
    schemas,
    services,
)


log = logging.getLogger()


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
                        choices=models.Producer.objects.filter(category__name="LLM").values_list("name", flat=True),
                        default=config.LLM_NAME,
                    )

                    method_p.add_argument(
                        "--nlp",
                        choices=models.Producer.objects.filter(category__name="NLP").values_list("name", flat=True),
                        default=config.NLP_NAME,
                    )

    def echo(self, s):
        self.stdout.write(s, ending="\n\r")
        self.stdout.flush()

    def echos(self, lst):
        terminal_size = os.get_terminal_size()
        terminal_width = terminal_size.columns
        for s in lst:
            self.echo("-" * terminal_width)
            self.echo(s)

    def handle(self, *args, **options):
        if options["debug"]:
            log.setLevel("DEBUG")
        else:
            log.setLevel("INFO")

        llm_producer = models.Producer.objects.get(name=options["llm"])
        nlp_producer = models.Producer.objects.get(name=options["nlp"])
        admin = User.objects.get(username="admin")
        env = schemas.get_worker_env()

        encoding = tiktoken.encoding_for_model(llm_producer.name)
        prompt = ""

        if options["entity"] == "redditor":
            identifier = options["username"]

            if options["service"] == "context-query":
                service_cls = services.RedditorContextQueryService
                if options["method"] in ("generate", "create-object"):
                    env.redditor.llm.prompt = input("prompt: ")
                    prompt = f"{env.redditor.llm.prompt_prefix} {env.redditor.llm.prompt}"
            else:
                prompt = f"{env.redditor.llm.prompt_prefix} {env.redditor.llm.prompt}"
                service_cls = services.RedditorDataService
        else:
            identifier = options["url"]

            if options["service"] == "context-query":
                service_cls = services.ThreadContextQueryService
                if options["method"] in ("generate", "create-object"):
                    env.thread.llm.prompt = input("prompt: ")
                    prompt = f"{env.thread.llm.prompt_prefix} {env.thread.llm.prompt}"
            else:
                prompt = f"{env.thread.llm.prompt_prefix} {env.thread.llm.prompt}"
                service_cls = services.ThreadDataService

        service = service_cls(
            identifier=identifier,
            llm_contributor=admin,
            llm_producer=llm_producer,
            nlp_contributor=admin,
            nlp_producer=nlp_producer,
            producer_settings=settings.DEFAULT_PRODUCER_SETTINGS,
            submitter=admin,
            env=env,
        )

        inputs: List[str] = service.get_inputs()

        log.debug(
            "Retrieved %s inputs (%s tokens) for %s",
            len(inputs),
            len(encoding.encode("|".join(inputs))),
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
