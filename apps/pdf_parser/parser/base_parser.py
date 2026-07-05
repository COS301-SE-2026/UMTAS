from abc import ABC, abstractmethod

from .models import ParserOutput, validate_parser_result


class BasePDFParser(ABC):
    """Thin Python-side parser interface for university parser adapters."""

    @abstractmethod
    def parse(self, file_path: str) -> ParserOutput:
        """Parse a PDF file into normalised import candidates."""

    def validate_result(self, result: ParserOutput) -> ParserOutput:
        validate_parser_result(result)
        return result
