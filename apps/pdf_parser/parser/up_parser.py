import re
from typing import Dict, Any, List
import fitz  # PyMuPDF
from .base_parser import BasePDFParser


class UPPDFParser(BasePDFParser):
    """
    University of Pretoria (UP) specific PDF Parser.
    Handles Lectures, Semester Tests, and Exams with precise row-splitting.
    """

    def detect_schedule_type(self, doc: fitz.Document) -> str:
        """
        Detects schedule type by looking at the first page's text.
        """
        first_page = doc[0]
        text = first_page.get_text()

        if not text:
            return 'unknown'

        # Check for keywords
        if "Semester Tests" in text:
            return 'test'
        if "Exams" in text:
            return 'exam'
        if "Lectures" in text:
            return 'lecture'

        return 'unknown'

    def extract_tables(self, doc: fitz.Document) -> List[List[List[str]]]:
        """
        Extracts raw tables from PDF pages, applying custom text boundary clipping for the
        'Lang' column to prevent bleed-over.
        """
        all_tables = []
        
        # 1. Identify the 'Lang' column index from the first page's header row.
        # This column index will be consistent across subsequent pages.
        lang_indices = []
        if len(doc) > 0:
            first_page = doc[0]
            tables = first_page.find_tables()
            if tables:
                t = tables[0]
                for col_idx, cell in enumerate(t.rows[0].cells):
                    header_text = first_page.get_text("text", clip=fitz.Rect(cell)).strip().replace('\n', ' ')
                    if header_text == "Lang":
                        lang_indices.append(col_idx)

        # 2. Iterate through pages and extract table text
        for page_idx, page in enumerate(doc):
            tables = page.find_tables()
            for t in tables:
                table_rows = []
                for r_idx, r in enumerate(t.rows):
                    row_data = []
                    
                    # Detect if this specific row is a header row (either page 0 row 0,
                    # or a repeated header row on later pages)
                    is_header_row = False
                    if r_idx == 0 and page_idx == 0:
                        is_header_row = True
                    else:
                        # Extract first row values to check if it's a repeated header
                        raw_cells_text = [page.get_text("text", clip=fitz.Rect(c)).strip().replace('\n', ' ') for c in r.cells]
                        if "Module" in raw_cells_text and "Lang" in raw_cells_text:
                            is_header_row = True

                    for col_idx, cell in enumerate(r.cells):
                        rect = fitz.Rect(cell)
                        
                        # Apply clipping to the Lang column only for data rows
                        if col_idx in lang_indices and not is_header_row:
                            clip_rect = fitz.Rect(rect.x0, rect.y0, min(rect.x1, rect.x0 + 12), rect.y1)
                            cell_text = page.get_text("text", clip=clip_rect)
                        else:
                            cell_text = page.get_text("text", clip=rect)
                            
                        row_data.append(cell_text)
                    table_rows.append(row_data)
                all_tables.append(table_rows)
        return all_tables

    def _split_multiline_row(self, headers: List[str], row: List[str]) -> List[Dict[str, Any]]:
        """
        Splits a single raw table row containing multiline text into multiple separate rows.
        Metadata columns (Module, Offered, Group, Lang, Campus, etc.) are treated as single-line
        replicated fields, while Activity, Day, Time, and Venue are split multiline.
        """
        headers = [h.strip().replace('\n', ' ') for h in headers]
        
        # Identify columns that are split vertically
        multiline_headers = {'Activity', 'Day', 'Time', 'Venue'}

        cell_lists = []
        for col_idx, col_name in enumerate(headers):
            cell_val = row[col_idx]
            if col_name in multiline_headers:
                cell_lists.append(str(cell_val or "").split('\n'))
            else:
                clean_metadata = str(cell_val or "").replace('\n', ' ').strip()
                clean_metadata = re.sub(r'\s+', ' ', clean_metadata)
                cell_lists.append([clean_metadata])

        num_splits = max(len(lst) for lst in cell_lists)

        split_rows = []
        for i in range(num_splits):
            sub_row = {}
            for col_idx, col_name in enumerate(headers):
                lst = cell_lists[col_idx]
                if len(lst) == 1:
                    val = lst[0].strip()
                    sub_row[col_name] = val if val != "" else None
                elif i < len(lst):
                    val = lst[i].strip()
                    sub_row[col_name] = val if val != "" else None
                else:
                    sub_row[col_name] = None
            split_rows.append(sub_row)

        return split_rows

    def _parse_generic_schedule(self, tables: List[List[List[str]]], expected_headers: List[str]) -> List[Dict[str, Any]]:
        """
        Generically parses tables based on expected headers and processes row-splitting.
        """
        events = []
        
        if not tables or not tables[0]:
            return events

        raw_headers = tables[0][0]
        headers = [h.strip().replace('\n', ' ') for h in raw_headers]
        last_seen_values = {h: None for h in headers}

        for table in tables:
            start_row_idx = 1 if table == tables[0] else 0

            for row_idx in range(start_row_idx, len(table)):
                raw_row = table[row_idx]
                
                cleaned_row_cells = [c.strip().replace('\n', ' ') for c in raw_row]
                if cleaned_row_cells == headers:
                    continue

                if len(raw_row) < len(headers):
                    raw_row.extend([""] * (len(headers) - len(raw_row)))
                elif len(raw_row) > len(headers):
                    raw_row = raw_row[:len(headers)]

                ffill_cols = {'Module', 'Offered', 'Status'}
                for idx, col_name in enumerate(headers):
                    val = raw_row[idx].strip()
                    if col_name in ffill_cols:
                        if val != "":
                            last_seen_values[col_name] = val
                        else:
                            raw_row[idx] = last_seen_values[col_name] or ""

                split_rows = self._split_multiline_row(headers, raw_row)
                for s_row in split_rows:
                    if s_row.get('Module') or s_row.get('Activity') or s_row.get('Day'):
                        events.append(s_row)

        return events

    def parse_lectures(self, tables: List[List[List[str]]]) -> List[Dict[str, Any]]:
        expected_headers = ['Module', 'Offered', 'Group', 'Lang', 'Activity', 'Day', 'Time', 'Venue', 'Campus', 'Study Prog']
        return self._parse_generic_schedule(tables, expected_headers)

    def parse_tests(self, tables: List[List[List[str]]]) -> List[Dict[str, Any]]:
        expected_headers = ['Module', 'Test', 'Day', 'Date', 'Time', 'Campus', 'Venue']
        return self._parse_generic_schedule(tables, expected_headers)

    def parse_exams(self, tables: List[List[List[str]]]) -> List[Dict[str, Any]]:
        expected_headers = ['Status', 'Module', 'Paper', 'Activity', 'Date', 'Start Time', 'Module Campus', 'Exam Campus', 'Venue', 'Exam Comments']
        return self._parse_generic_schedule(tables, expected_headers)
