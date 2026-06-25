from abc import ABC, abstractmethod
from typing import Any, Dict

from .models import validate_parser_result


class BasePDFParser(ABC):

    @abstractmethod
    def parse(self, file_path: str) -> Dict[str, Any]:
        """Virtual Method"""

    def validate_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        validate_parser_result(result)
        return result
