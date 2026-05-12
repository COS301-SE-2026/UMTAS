# pdfplumber Reference Manual (v0.12.0)

## Section 0: Quick Start

Extract text and tables from a PDF with precision and visual debugging.

```python
# Install pdfplumber
pip install pdfplumber

# Extract text from the first page
import pdfplumber
with pdfplumber.open("example.pdf") as pdf:
    first_page = pdf.pages[0]
    print(first_page.extract_text())
    print(first_page.extract_tables())
```

Expected output: Plain text content and a list of lists representing table rows/columns.

## Section 1: Key Language Terms & Features

- **Page Object** — Represents a single page in the PDF, containing characters, lines, and rects. | `page = pdf.pages[0]` | ⚠️ Indices are 0-based; PDF page numbers are usually 1-based.
- **extract_text()** — High-level function to extract all text on a page into a single string. | `page.extract_text(x_tolerance=3)` | ⚠️ Adjust `x_tolerance` if words are being incorrectly merged or split.
- **extract_tables()** — Identifies and extracts tabular data into Python lists. | `page.extract_tables()` | ⚠️ Requires clear lines or strict alignment; use `table_settings` for borderless tables.
- **Visual Debugging** — Ability to export page snapshots with highlighted text/tables for inspection. | `page.to_image().draw_rects(page.rects).show()` | ⚠️ Essential for diagnosing failed extractions in complex layouts.
- **Cropping** — Creating a sub-page object to focus extraction on a specific region. | `page.crop((x0, y0, x1, y1))` | ⚠️ Coordinates start from the top-left (0,0) by default in pdfplumber.
- **Filtering** — Removing unwanted objects (like images or lines) before processing text. | `page.filter(lambda obj: obj["object_type"] == "char")` | ⚠️ Can significantly speed up processing for very dense PDF files.
- **Metadata** — Access to PDF properties like Author, CreationDate, and Title. | `pdf.metadata` | ⚠️ Often empty or inaccurate depending on the software that generated the PDF.
- **Rects/Lines/Curves** — Geometric primitives representing the visual elements of the PDF. | `page.rects` | ⚠️ Useful for identifying headers, footers, or separators manually.
- **Char Dictionary** — Detailed data for every single character, including font, size, and color. | `page.chars[0]` | ⚠️ Accessing this directly is powerful but can be memory-intensive for large files.
- **Layout Analysis** — Automatic detection of columns and paragraphs (heuristic-based). | `page.extract_text(layout=True)` | ⚠️ May struggle with multi-column layouts that don't use standard spacing.

## Section 2: Key Commands & Workflows

- `pdfplumber.open("path/to/file.pdf")` — Opens a PDF file for processing. | _Loading the document._
- `page.extract_text()` — Returns the text content of a page. | _General content extraction._
- `page.extract_table(table_settings={...})` — Returns the first table found on a page. | _Data scraping._
- `page.to_image(res=72)` — Renders a page as an image for debugging. | _Validating extraction logic._
- `page.within_bbox((x0, y0, x1, y1))` — Finds objects strictly inside a bounding box. | _Targeted extraction._
- `page.objects` — A dictionary containing lists of all elements on the page. | _Low-level inspection._
- `pdf.close()` — Explicitly closes the file handle. | _Resource management._
- `page.extract_words()` — Returns a list of dictionaries, one for each word with coordinates. | _Precise text positioning._

## Section 3: Architecture & Component Relationships

```
PDF File (.pdf)
       ↓ (pdfminer.six)
Raw Byte Stream & Objects
       ↓ (pdfplumber)
Pythonic API (Pages, Chars, Rects)
       ↓
Extraction Engine (Text, Tables, Layout)
       ↓
Data Output (String, List, Image)
```

**Key Flow:** pdfplumber builds on top of **pdfminer.six** to provide a high-level, human-friendly API. It organizes raw PDF objects into a coordinate-based system that allows for **visual debugging** and **precise cropping**.

## Section 4: Documentation Links

- [Official GitHub Repository](https://github.com/jsvine/pdfplumber) — _Main source code and documentation._
- [Table Extraction Tutorial](https://github.com/jsvine/pdfplumber#extracting-tables) — _Detailed guide on handling complex tables._
- [pdfminer.six Docs](https://pdfminersix.readthedocs.io/) — _The underlying engine documentation._
- [Visual Debugging Guide](https://github.com/jsvine/pdfplumber#visual-debugging) — _How to use the image-based inspection tools._
- [Examples Folder](https://github.com/jsvine/pdfplumber/tree/stable/examples) — _Real-world scripts for various PDF formats._
