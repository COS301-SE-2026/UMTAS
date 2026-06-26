from typing import Dict, Type

from .base_parser import BasePDFParser
from .models import ParserError
from .adapters.up_parser import UPPDFParser


PARSER_REGISTRY: Dict[str, Type[BasePDFParser]] = {
    "up": UPPDFParser,
}


def get_parser(adapter_key: str) -> BasePDFParser:
    parser_class = PARSER_REGISTRY.get(adapter_key)
    if parser_class is None:
        raise ParserError(
            "UNKNOWN_ADAPTER",
            f"No parser adapter is registered for '{adapter_key}'.",
            {"adapterKey": adapter_key},
        )
    return parser_class()
