# University Adapter Case Study

## 1. Overview

This case study examines how UMTAS isolates university-specific timetable formats behind a common adapter contract, with specific attention to **modifiability**. University timetables differ in layout, column order, naming and date formats. Allowing those differences into the core application would increase coupling and make change costly.

---

## 2. Context

UMTAS imports timetable PDFs from universities and converts them into canonical import candidates: modules, events and warnings. The canonical models are defined once in `apps/pdf_parser/parser/models.py`. The University of Pretoria (UP) is the implemented university.

> How does UMTAS support university-specific formats without leaking them into the canonical models, the command line interface or the queue contracts?

---

## 3. Solution Approach

### 3.1 Architecture

| Element | Location | Responsibility |
|---|---|---|
| Adapter contract | `apps/pdf_parser/parser/base_parser.py` | The abstract `BasePDFParser` declares `parse(file_path)` and result validation. |
| Concrete adapters | `apps/pdf_parser/parser/adapters/` | University-specific detection, table extraction and normalisation. `UPPDFParser` is the UP adapter. |
| Registry | `apps/pdf_parser/parser/registry.py` | `PARSER_REGISTRY` maps an adapter key to a parser class. `get_parser` resolves the key. |
| Canonical models | `apps/pdf_parser/parser/models.py` | Shared candidate types and `validate_parser_result`, which every adapter output passes through. |
| Command line interface | `apps/pdf_parser/parser_cli.py` | Resolves the adapter by key and emits canonical JSON or a structured error. |

### 3.2 Adapter Contract

```python
class BasePDFParser(ABC):
    @abstractmethod
    def parse(self, file_path: str) -> ParserOutput: ...

    def validate_result(self, result: ParserOutput) -> ParserOutput: ...
```

Every adapter returns the same canonical output and is validated by the same function.

### 3.3 Adapter Responsibilities

Concrete adapters own all university-specific behaviour: schedule type detection, column layouts, cell cleaning, and translation of malformed input into structured `ParserError` codes. The UP adapter is split into `up_parser.py`, `up_lectures.py`, `up_tests.py`, `up_exams.py` and `up_values.py`. The canonical models, registry and command line interface contain no UP-specific logic.

---

## 4. Quality Attribute Focus

**Modifiability** is the primary concern: university-specific change must stay inside the adapter layer. Timetable formats vary independently of the core, so they are treated as volatile.

---

## 5. Non-Functional Requirement

### 5.1 NFR-Maint-1

> University-specific parsing behaviour is confined to adapter modules that implement a single adapter contract and are selected through a registry. The canonical models and the command line interface contain no university-specific logic.

### 5.2 Measure and Target

**Measure:** Count of university-specific rules located outside `apps/pdf_parser/parser/adapters/`.

**Target:** 0. The only shared points are the `BasePDFParser` contract and the `PARSER_REGISTRY` mapping.

---

## 6. Tactics

- **Isolate volatile behaviour.** Format knowledge lives in `apps/pdf_parser/parser/adapters/`.
- **Depend on abstractions.** The command line interface depends on `BasePDFParser` and `get_parser`, never on a concrete adapter.
- **Validate at the boundary.** `validate_parser_result` applies one canonical schema to every adapter.
- **Fail with structured errors.** An unregistered key produces the `UNKNOWN_ADAPTER` error rather than a crash.

---

## 7. Trade-offs

**Benefits**

- University formats are contained in one directory.
- The canonical output is uniform for every consumer.
- The registry gives a single, testable lookup point.

**Costs**

- An abstract layer and a registry add indirection.
- The contract must remain general enough for every university without accumulating provider-specific features.

---

## 8. Change Boundary

| Component | University-specific logic | Location |
|---|---|---|
| Concrete adapter | Yes | `apps/pdf_parser/parser/adapters/` |
| Registry | Key to class mapping only | `apps/pdf_parser/parser/registry.py` |
| Adapter contract | No | `apps/pdf_parser/parser/base_parser.py` |
| Canonical models | No | `apps/pdf_parser/parser/models.py` |
| Command line interface | No | `apps/pdf_parser/parser_cli.py` |

---

## 9. Verification

The parser suite (`apps/pdf_parser/parser/tests`) verifies the boundary:

- `test_registry.py` verifies that `get_parser("up")` returns the UP adapter and that an unknown key raises `UNKNOWN_ADAPTER`.
- `test_cli_contract.py` verifies that the command line interface emits canonical output for lecture, test and exam timetables and a structured error for an unknown adapter.
- The UP ground truth, schema and error handling tests verify that adapter output meets the canonical contract.

The command and its recorded output are listed in the [evidence register](NON-FUNCTIONAL_TESTING.md). The requirement passes when the parser suite passes and no university-specific rule exists outside the adapter directory.

---

## 10. Findings

University-specific behaviour sits behind a stable contract, and the canonical models, registry and command line interface remain free of university-specific rules. The architecture supports the modifiability requirement.

A new university requires new adapter code. The benefit is confinement of that code to the adapter layer instead of its spread across the application.

---

## 11. Conclusion

The adapter contract, registry and canonical models isolate university-specific parsing from the rest of the system. NFR-Maint-1 is met by this structure and verified by the parser suite.

The trade-off, additional abstraction in exchange for reduced change propagation, is appropriate because university timetable formats are a known source of volatility.
