import json
import urllib.request
from abc import ABC, abstractmethod
from typing import Dict, Any, List
import fitz  # PyMuPDF


class BasePDFParser(ABC):
    """
    Abstract base class for all university PDF parsers.
    Specifies only the core interaction contract and background callback execution.
    """
    def __init__(self, max_pages: int = 100):
        self.max_pages = max_pages

    def parse(self, file_path: str) -> Dict[str, Any]:
        """
        Main template method to parse a PDF file.
        
        Args:
            file_path: Absolute path to the PDF file.
            
        Returns:
            Dictionary containing the 'events' list and detected 'type'.
        """
        doc = fitz.open(file_path)
        try:
            # 1. Enforce page limit validation
            num_pages = len(doc)
            if num_pages == 0:
                raise ValueError("The uploaded PDF file has no pages.")
            if num_pages > self.max_pages:
                raise ValueError(
                    f"PDF page limit exceeded. Found {num_pages} pages, "
                    f"maximum allowed is {self.max_pages}."
                )

            # 2. Detect PDF Schedule Type
            schedule_type = self.detect_schedule_type(doc)
            if schedule_type == 'unknown':
                raise ValueError(
                    "Unable to determine PDF schedule type. "
                    "Expected 'Lectures', 'Semester Tests', or 'Exams' identifiers."
                )

            # 3. Extract tables from all pages
            all_tables = self.extract_tables(doc)

            if not all_tables:
                raise ValueError("No tables were found in the PDF.")

            # 4. Route to specific parsing implementation
            if schedule_type == 'lecture':
                events = self.parse_lectures(all_tables)
            elif schedule_type == 'test':
                events = self.parse_tests(all_tables)
            elif schedule_type == 'exam':
                events = self.parse_exams(all_tables)
            else:
                raise ValueError(f"Unsupported schedule type: {schedule_type}")

            return {
                "events": events,
                "type": schedule_type
            }
        finally:
            doc.close()

    def extract_tables(self, doc: fitz.Document) -> List[List[List[str]]]:
        """
        Extracts raw tables from PDF pages.
        Can be overridden by child classes to customize extraction bounds/clipping.
        """
        all_tables = []
        for page in doc:
            tables = page.find_tables()
            for table in tables:
                all_tables.append(table.extract())
        return all_tables

    @abstractmethod
    def detect_schedule_type(self, doc: fitz.Document) -> str:
        """
        Scans the PDF to identify the type of schedule: 'lecture', 'test', 'exam', or 'unknown'.
        """
        pass

    @abstractmethod
    def parse_lectures(self, tables: List[List[List[str]]]) -> List[Dict[str, Any]]:
        """
        Parses raw extracted tables for a lecture schedule.
        """
        pass

    @abstractmethod
    def parse_tests(self, tables: List[List[List[str]]]) -> List[Dict[str, Any]]:
        """
        Parses raw extracted tables for a semester test schedule.
        """
        pass

    @abstractmethod
    def parse_exams(self, tables: List[List[List[str]]]) -> List[Dict[str, Any]]:
        """
        Parses raw extracted tables for an exam schedule.
        """
        pass

    def send_callback(self, callback_url: str, job_id: str, status: str, data: Any = None, error: str = None) -> bool:
        """
        Sends the parsing results back to the core NestJS backend via HTTP POST callback.
        """
        payload = {
            "jobId": job_id,
            "status": status
        }
        if data is not None:
            payload["data"] = data
        if error is not None:
            payload["error"] = error

        req_data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            callback_url,
            data=req_data,
            headers={'Content-Type': 'application/json'}
        )
        
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                return response.status == 200
        except Exception as e:
            print(f"Callback delivery failed: {e}", flush=True)
            return False
