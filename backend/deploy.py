#!/usr/bin/env python
import argparse
import subprocess

from dotenv import dotenv_values
import git


config = dotenv_values(".env")


def confirm_command(command):
    print(command)
    user_input = input("[N/y]: ")
    return user_input.lower() == "y"


def get_latest_tag():
    repo = git.Repo("..")
    return sorted(repo.tags, key=lambda tag: tag.name)[-1]


def parse_args():
    parser = argparse.ArgumentParser(formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument(
        "-p",
        "--push",
        action="store_true",
        help="Push the last image without building.",
    )
    parser.add_argument(
        "-t",
        "--tag",
        default=get_latest_tag(),
        help="Tag the newly built image before pushing. Tag HEAD with TAG if not in git history.",
    )
    return parser.parse_args()


def main(args):
    registry_url = f"{config['REGISTRY_URL']}/{config['CONTAINER_REPO']}"

    subprocess.check_call(["docker", "compose", "build"])

    for service_name in ("server", "worker"):
        image_url = f"{registry_url}/{config['APP_NAME']}/{service_name}:{args.tag}"
        push_cmd = ["docker", "push", image_url]

        if confirm_command(" ".join(push_cmd)):
            subprocess.check_call(push_cmd)


if __name__ == "__main__":
    main(parse_args())
