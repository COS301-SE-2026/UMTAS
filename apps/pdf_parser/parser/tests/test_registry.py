import pytest

from parser.adapters.up_parser import UPPDFParser
from parser.models import ParserError
from parser.registry import get_parser


def test_get_parser_returns_up_adapter():
    assert isinstance(get_parser("up"), UPPDFParser)


def test_get_parser_rejects_unknown_adapter():
    with pytest.raises(ParserError) as exc_info:
        get_parser("unknown")

    assert exc_info.value.to_dict() == {
        "code": "UNKNOWN_ADAPTER",
        "message": "No parser adapter is registered for 'unknown'.",
        "details": {"adapterKey": "unknown"},
    }
