import re
from typing import Any, Dict, List, Optional


EVENT_TYPES = {"lecture", "tutorial", "prac", "test", "exam"}
TIME_RE = re.compile(r"^\d{2}:\d{2}$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class ParserError(Exception):
    def __init__(self, code: str, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        return {"code": self.code, "message": self.message, "details": self.details}


def validate_parser_result(result: Dict[str, Any]) -> None:
    if set(result.keys()) != {"modules", "events", "warnings"}:
        raise ParserError(
            "INVALID_PARSER_RESULT",
            "Parser output must contain only modules, events, and warnings.",
            {"keys": sorted(result.keys())},
        )

    for module in result["modules"]:
        _require(module, ["sourceId", "code", "metadata", "warnings"], "module")

    for event in result["events"]:
        _require(
            event,
            [
                "sourceId",
                "moduleCode",
                "type",
                "sectionLabel",
                "title",
                "startTime",
                "endTime",
                "venues",
                "isRecurring",
                "metadata",
                "warnings",
            ],
            "event",
        )
        if event["type"] not in EVENT_TYPES:
            raise ParserError("INVALID_EVENT_TYPE", "Parser emitted an unsupported event type.", {"type": event["type"]})
        if not TIME_RE.match(event["startTime"]) or not TIME_RE.match(event["endTime"]):
            raise ParserError("INVALID_TIME", "Parser emitted a time outside HH:mm format.", {"sourceId": event["sourceId"]})
        if event.get("date") is not None and not DATE_RE.match(event["date"]):
            raise ParserError("INVALID_DATE", "Parser emitted a date outside YYYY-MM-DD format.", {"sourceId": event["sourceId"]})
        if event["isRecurring"] and not event.get("day"):
            raise ParserError("INVALID_RECURRING_EVENT", "Recurring parser events must include a day.", {"sourceId": event["sourceId"]})
        if not isinstance(event["venues"], list):
            raise ParserError("INVALID_VENUES", "Parser event venues must be an array.", {"sourceId": event["sourceId"]})


def _require(candidate: Dict[str, Any], keys: List[str], label: str) -> None:
    missing = [key for key in keys if key not in candidate]
    if missing:
        raise ParserError("INVALID_PARSER_RESULT", f"Parser {label} is missing required fields.", {"missing": missing})
