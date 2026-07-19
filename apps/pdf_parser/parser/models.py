import re
from typing import List, Literal, Optional, TypedDict


EVENT_TYPES = {"lecture", "tutorial", "prac", "test", "exam"}
TIME_RE = re.compile(r"^\d{2}:\d{2}$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

ParserDetails = dict[str, object]
ActivityType = Literal["lecture", "tutorial", "prac", "test", "exam"]


class ParseAnnotation(TypedDict):
    code: str
    message: str
    details: ParserDetails


class ModuleCandidate(TypedDict):
    code: str
    name: Optional[str]
    metadata: ParserDetails
    warnings: List[ParseAnnotation]


class EventCandidate(TypedDict):
    moduleCode: str
    activityType: ActivityType
    activityCode: str
    title: str
    day: Optional[str]
    date: Optional[str]
    startTime: str
    endTime: str
    venues: List[str]
    isRecurring: bool
    metadata: ParserDetails
    warnings: List[ParseAnnotation]


class ParserOutput(TypedDict):
    modules: List[ModuleCandidate]
    events: List[EventCandidate]
    warnings: List[ParseAnnotation]


class ParserError(Exception):
    def __init__(self, code: str, message: str, details: Optional[ParserDetails] = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}

    def to_dict(self) -> ParserDetails:
        return {"code": self.code, "message": self.message, "details": self.details}


def validate_parser_result(result: ParserOutput) -> None:
    if set(result.keys()) != {"modules", "events", "warnings"}:
        raise ParserError(
            "INVALID_PARSER_RESULT",
            "Parser output must contain only modules, events, and warnings.",
            {"keys": sorted(result.keys())},
        )

    for module in result["modules"]:
        _require(module, ["code", "metadata", "warnings"], "module")

    for event in result["events"]:
        _require(
            event,
            [
                "moduleCode",
                "activityType",
                "activityCode",
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
        if event["activityType"] not in EVENT_TYPES:
            raise ParserError("INVALID_EVENT_TYPE", "Parser emitted an unsupported event type.", {"activityType": event["activityType"]})
        if not TIME_RE.match(event["startTime"]) or not TIME_RE.match(event["endTime"]):
            raise ParserError("INVALID_TIME", "Parser emitted a time outside HH:mm format.", {"event": event})
        if event.get("date") is not None and not DATE_RE.match(event["date"]):
            raise ParserError("INVALID_DATE", "Parser emitted a date outside YYYY-MM-DD format.", {"event": event})
        if event["isRecurring"] and not event.get("day"):
            raise ParserError("INVALID_RECURRING_EVENT", "Recurring parser events must include a day.", {"event": event})
        if event["isRecurring"] and event.get("date") is not None:
            raise ParserError("INVALID_RECURRING_EVENT", "Recurring parser events must not include a date.", {"event": event})
        if not event["isRecurring"] and not event.get("date"):
            raise ParserError("INVALID_DATED_EVENT", "Non-recurring parser events must include a date.", {"event": event})
        if not event["isRecurring"] and event.get("day") is not None:
            raise ParserError("INVALID_DATED_EVENT", "Non-recurring parser events must not include a weekday.", {"event": event})
        if not isinstance(event["venues"], list):
            raise ParserError("INVALID_VENUES", "Parser event venues must be an array.", {"event": event})


def _require(candidate: ParserDetails, keys: List[str], label: str) -> None:
    missing = [key for key in keys if key not in candidate]
    if missing:
        raise ParserError("INVALID_PARSER_RESULT", f"Parser {label} is missing required fields.", {"missing": missing})
