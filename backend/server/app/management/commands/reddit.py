import logging
import os

from constance import config
from django.core import management

from ...models import (
    LLM,
)
from ...services import (
    RedditorService,
    ThreadService,
)


log = logging.getLogger()


class Command(management.base.BaseCommand):
    def add_arguments(self, parser):
        action_sp = parser.add_subparsers(title="actions", dest="action", required=True)

        process_sp = action_sp.add_parser("process", help="reddit entity processing.")
        submissions_sp = action_sp.add_parser("submissions", help="reddit entity submissions.")
        stats_sp = action_sp.add_parser("stats", help="reddit entity stats.")

        for sp in (process_sp, submissions_sp, stats_sp):
            entity_sp = sp.add_subparsers(title="entities", dest="entity", required=True)

            thread_sp = entity_sp.add_parser("thread", help="Process a reddit thread.")
            thread_sp.add_argument("url", help="Reddit thread URL.")
            thread_sp.add_argument('--debug', action='store_true', help="Set log level to DEBUG.")

            thread_sp = entity_sp.add_parser("redditor", help="Process a redditor.")
            thread_sp.add_argument("username", help="Redditor username.")
            thread_sp.add_argument("--llm", type=lambda name: LLM.objects.get(name=name), default=config.OPENAI_MODEL, help="OpenAI model to use for processing.")
            thread_sp.add_argument('--debug', action='store_true', help="Set log level to DEBUG.")

    def echo(self, s):
        self.stdout.write(s, ending='\n\r')
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

        match options["entity"]:
            case "thread":
                service = ThreadService(options["url"])

                match options["action"]:
                    case "process":
                        service.process()
                    case "submissions":
                        submissions = service.get_submissions(
                            max_submissions=config.THREAD_MAX_COMMENTS_PROCESSED,
                            min_characters_per_submission=config.CONTENT_FILTER_MIN_LENGTH,
                            min_submissions=config.THREAD_MIN_COMMENTS_PROCESSED,
                        )
                        self.echos(submissions)
                    case "stats":
                        submissions = service.get_submissions(
                            max_submissions=config.THREAD_MAX_COMMENTS_PROCESSED,
                            min_characters_per_submission=config.CONTENT_FILTER_MIN_LENGTH,
                            min_submissions=config.THREAD_MIN_COMMENTS_PROCESSED,
                        )
                        stats = service.infer_stats(input_content=submissions)
                        self.echo(stats.model_dump_json())
            case "redditor":
                llm = options["llm"]
                service = RedditorService(options["username"])

                match options["action"]:
                    case "process":
                        service.process("admin")
                    case "submissions":
                        submissions = service.get_submissions(
                            max_characters=llm.context_window,
                            min_characters_per_submission=config.CONTENT_FILTER_MIN_LENGTH,
                            min_submissions=config.REDDITOR_MIN_SUBMISSIONS,
                        )
                        self.echos(submissions)
                    case "stats":
                        submissions = service.get_submissions(
                            max_characters=llm.context_window,
                            min_characters_per_submission=config.CONTENT_FILTER_MIN_LENGTH,
                            min_submissions=config.REDDITOR_MIN_SUBMISSIONS,
                        )
                        stats = service.infer_stats(
                            llm_name=llm.name,
                            input_content="|".join(submissions),
                            input_prompt=config.REDDITOR_LLM_STATS_PROMPT,
                        )
                        self.echo(stats.model_dump_json())
