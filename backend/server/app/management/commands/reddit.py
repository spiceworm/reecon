"""
Management command that provides more control over inspecting the behavior and output of
`RedditorDataService` and `ThreadDataService`. `RedditDataService.create()` runs all the
necessary methods encapsulated in a single method, but this script allows you to see how the
output of each of those encapsulated methods is used as input for the next method.
"""

import logging
import os
from typing import List

from constance import config
from django.contrib.auth.models import User
from django.core import management
import tiktoken

from ...exceptions import (
    UnprocessableRedditorError,
    UnprocessableThreadError,
)
from ...models import (
    Producer,
    RedditorData,
    ThreadData,
    UnprocessableRedditor,
    UnprocessableThread,
)
from ...services import (
    GeneratedRedditorData,
    GeneratedThreadData,
    RedditorDataService,
    ThreadDataService,
)


log = logging.getLogger()


class Command(management.base.BaseCommand):
    def add_arguments(self, parser):
        action_sp = parser.add_subparsers(title="actions", dest="action", required=True)

        create_object_sp = action_sp.add_parser("create-object", help="reddit entity processing.")
        get_submissions_sp = action_sp.add_parser("get-submissions", help="reddit entity submissions.")
        generate_data_sp = action_sp.add_parser("generate-data", help="reddit entity stats.")

        for sp in (create_object_sp, get_submissions_sp, generate_data_sp):
            entity_sp = sp.add_subparsers(title="entities", dest="entity", required=True)

            thread_sp = entity_sp.add_parser("thread", help="Process a reddit thread.")
            thread_sp.add_argument("url", help="Reddit thread URL.")
            thread_sp.add_argument("--debug", action="store_true", help="Set log level to DEBUG.")
            thread_sp.add_argument(
                "--llm",
                choices=Producer.objects.filter(category__name="LLM").values_list("name", flat=True),
                default=config.LLM_NAME,
                help="LLM choice to use when generating data.",
            )
            thread_sp.add_argument(
                "--nlp",
                choices=Producer.objects.filter(category__name="NLP").values_list("name", flat=True),
                default=config.NLP_NAME,
                help="NLP choice to use when generating data.",
            )

            redditor_sp = entity_sp.add_parser("redditor", help="Process a redditor.")
            redditor_sp.add_argument("username", help="Redditor username.")
            redditor_sp.add_argument("--debug", action="store_true", help="Set log level to DEBUG.")
            redditor_sp.add_argument(
                "--llm",
                choices=Producer.objects.filter(category__name="LLM").values_list("name", flat=True),
                default=config.LLM_NAME,
                help="LLM choice to use when generating data.",
            )
            redditor_sp.add_argument(
                "--nlp",
                choices=Producer.objects.filter(category__name="NLP").values_list("name", flat=True),
                default=config.NLP_NAME,
                help="NLP choice to use when generating data.",
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

        llm = Producer.objects.get(name=options["llm"])
        nlp = Producer.objects.get(name=options["nlp"])
        admin = User.objects.get(username="admin")

        encoding = tiktoken.encoding_for_model(llm.name)

        if options["entity"] == "redditor":
            username = options["username"]
            service = RedditorDataService(username)

            try:
                submissions: List[str] = service.get_submissions(llm_producer=llm)
                if options["action"] == "get-submissions":
                    self.echos(submissions)
                    log.debug(
                        "Retrieved %s submissions (%s tokens) for %s",
                        len(submissions),
                        len(encoding.encode("|".join(submissions))),
                        service.username,
                    )
                else:
                    generated_data: GeneratedRedditorData = service.generate_data(
                        inputs=submissions,
                        llm_name=llm.name,
                        nlp_name=nlp.name,
                        prompt=config.REDDITOR_LLM_PROMPT,
                    )
                    if options["action"] == "generate-data":
                        self.echo(generated_data.model_dump_json())
            except UnprocessableRedditorError as e:
                log.exception("Unable to process %s", username)
                obj, _ = UnprocessableRedditor.objects.update_or_create(
                    username=e.username,
                    defaults={
                        "reason": e.reason,
                    },
                    create_defaults={
                        "reason": e.reason,
                        "username": e.username,
                    },
                )
            else:
                if options["action"] == "create-object":
                    obj: RedditorData = service.create_object(
                        generated_data=generated_data,
                        llm_contributor=admin,
                        llm_producer=llm,
                        nlp_contributor=admin,
                        nlp_producer=nlp,
                    )

        else:
            url = options["url"]
            service = ThreadDataService(url)

            try:
                submissions: List[str] = service.get_submissions(llm_producer=llm)
                if options["action"] == "get-submissions":
                    self.echos(submissions)
                    log.debug(
                        "Retrieved %s submissions (%s tokens) for %s",
                        len(submissions),
                        len(encoding.encode("|".join(submissions))),
                        service.url,
                    )
                else:
                    generated_data: GeneratedThreadData = service.generate_data(
                        inputs=submissions,
                        llm_name=llm.name,
                        nlp_name=nlp.name,
                        prompt=config.THREAD_LLM_PROMPT,
                    )
                    if options["action"] == "generate-data":
                        self.echo(generated_data.model_dump_json())
            except UnprocessableThreadError as e:
                log.exception("Unable to process %s", url)
                obj, _ = UnprocessableThread.objects.update_or_create(
                    url=e.url,
                    defaults={
                        "reason": e.reason,
                    },
                    create_defaults={
                        "reason": e.reason,
                        "url": e.url,
                    },
                )
            else:
                if options["action"] == "create-object":
                    obj: ThreadData = service.create_object(
                        generated_data=generated_data,
                        llm_contributor=admin,
                        llm_producer=llm,
                        nlp_contributor=admin,
                        nlp_producer=nlp,
                    )
