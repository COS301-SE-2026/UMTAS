import contextlib
import io
import json
import sys
from typing import Any

from parser.models import ParserError
from parser.registry import get_parser


def main() -> int:
    for line in sys.stdin:
        if not line.strip():
            continue

        response = handle_line(line)
        print(json.dumps(response, separators=(",", ":")), flush=True)

    return 0


def handle_line(line: str) -> dict[str, Any]:
    request_id = ""

    try:
        request = json.loads(line)
        if isinstance(request, dict) and isinstance(request.get("requestId"), str):
            request_id = request["requestId"]

        if not isinstance(request, dict):
            raise ParserError("PARSER_PROTOCOL_ERROR", "Parser worker request must be a JSON object.")

        adapter_key = request.get("adapterKey")
        file_path = request.get("filePath")

        if not isinstance(adapter_key, str) or not adapter_key:
            raise ParserError(
                "PARSER_PROTOCOL_ERROR",
                "Parser worker request adapterKey must be a non-empty string.",
                {"requestId": request_id},
            )

        if not isinstance(file_path, str) or not file_path:
            raise ParserError(
                "PARSER_PROTOCOL_ERROR",
                "Parser worker request filePath must be a non-empty string.",
                {"requestId": request_id},
            )

        parser = get_parser(adapter_key)
        parser_stdout = io.StringIO()
        with contextlib.redirect_stdout(parser_stdout):
            result = parser.parse(file_path)

        diagnostics = parser_stdout.getvalue()
        if diagnostics:
            print(diagnostics, file=sys.stderr, end="", flush=True)

        return {"requestId": request_id, "status": "completed", "result": result}
    except json.JSONDecodeError as exc:
        return _failed_response(
            request_id,
            "PARSER_PROTOCOL_ERROR",
            "Parser worker request was not valid JSON.",
            {"error": str(exc)},
        )
    except ParserError as exc:
        return {"requestId": request_id, "status": "failed", "error": exc.to_dict()}
    except Exception as exc:
        return _failed_response(request_id, "PARSER_FAILED", str(exc), {})


def _failed_response(
    request_id: str,
    code: str,
    message: str,
    details: dict[str, Any],
) -> dict[str, Any]:
    return {
        "requestId": request_id,
        "status": "failed",
        "error": {"code": code, "message": message, "details": details},
    }


if __name__ == "__main__":
    sys.exit(main())
