#!/usr/bin/env python3
"""Run a test and write its complete output with command metadata."""

import argparse
import os
from pathlib import Path
import platform
import subprocess


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    parser.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    command = args.command[1:] if args.command[:1] == ["--"] else args.command
    if not command:
        parser.error("a command is required after --")
    env = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}
    result = subprocess.run(command, text=True, capture_output=True, env=env)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        f"Command: {' '.join(command)}\n"
        f"Exit code: {result.returncode}\n"
        f"Environment: {platform.platform()}\n"
        + result.stdout + result.stderr
    )
    print(args.output)
    raise SystemExit(result.returncode)


if __name__ == "__main__":
    main()
