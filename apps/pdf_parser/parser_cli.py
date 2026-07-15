import argparse
import contextlib
import io
import json
import sys

from parser.models import ParserError
from parser.registry import get_parser


def main() -> int:
    cli = argparse.ArgumentParser()
    cli.add_argument("--adapter", required=True)
    cli.add_argument("--file", required=True)
    args = cli.parse_args()

    try:
        parser = get_parser(args.adapter)
        parser_stdout = io.StringIO()
        with contextlib.redirect_stdout(parser_stdout):
            result = parser.parse(args.file)
        diagnostics = parser_stdout.getvalue()
        if diagnostics:
            print(diagnostics, file=sys.stderr, end="")
        print(json.dumps(result, separators=(",", ":")))
        return 0
    except ParserError as exc:
        print(json.dumps(exc.to_dict(), separators=(",", ":")))
        return 2
    except Exception as exc:
        error = {
            "code": "PARSER_FAILED",
            "message": str(exc),
            "details": {},
        }
        print(json.dumps(error, separators=(",", ":")))
        return 1


if __name__ == "__main__":
    sys.exit(main())
