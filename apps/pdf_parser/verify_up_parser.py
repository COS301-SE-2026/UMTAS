import os
import sys

# Ensure apps/pdf_parser is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from parser import UPPDFParser, process_events


def print_event(idx: int, event: dict):
    print(f"\n--- Row {idx + 1} ---")
    for key, val in event.items():
        print(f"  {key:<15}: {val}")


import json

def run_automated_tests(test_dir: str):
    print("\nRunning Verification Test Suite...")
    parser = UPPDFParser()
    
    # Files to parse
    test_cases = {
        "lecture": os.path.join(test_dir, "LECTURES_BOTH.pdf"),
        "test": os.path.join(test_dir, "SEM_TESTS_BOTH.pdf"),
        "exam": os.path.join(test_dir, "EXAMS_BOTH.pdf")
    }
    
    results = {}
    output_lines = []

    def log(msg: str = ""):
        print(msg)
        output_lines.append(msg)

    # Capture print_event output to output_lines
    def log_event(idx: int, event: dict):
        log(f"\n--- Row {idx + 1} ---")
        for key, val in event.items():
            log(f"  {key:<15}: {val}")

    for case_type, path in test_cases.items():
        if not os.path.exists(path):
            log(f"Error: Missing verification PDF at path '{path}'")
            continue
            
        try:
            filename = os.path.basename(path)
            log("\n" + "=" * 60)
            log(f"FULL PRINTOUT FOR {case_type.upper()} SCHEDULE ({filename})")
            log("=" * 60)
            
            raw_result = parser.parse(path)
            processed_events = process_events(raw_result['events'])
            
            # Print every single row of the parsed output
            for idx, event in enumerate(processed_events):
                log_event(idx, event)
                
            # Extract a small subset (first 3 events)
            subset = processed_events[:3]
            
            results[case_type] = {
                "source_file": filename,
                "detected_type": raw_result["type"],
                "total_rows": len(processed_events),
                "subset": subset
            }
            log(f"\n✓ Finished parsing {case_type} schedule: {len(processed_events)} total rows extracted.")
        except Exception as e:
            results[case_type] = {
                "source_file": os.path.basename(path),
                "error": str(e)
            }
            log(f"✗ Failed to parse {case_type} schedule: {e}")
            
    log("\n" + "=" * 60)
    log("VERIFICATION SUITE JSON SUBSET (Copy & Paste this block into your agent)")
    log("=" * 60)
    log("```json")
    log(json.dumps(results, indent=2))
    log("```")
    log("=" * 60)

    # Write output to pdf_verify_output.txt
    output_file = "pdf_verify_output.txt"
    try:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("\n".join(output_lines) + "\n")
        print(f"\n✓ Verification printout successfully written to: {os.path.abspath(output_file)}")
    except Exception as e:
        print(f"\n✗ Failed to write verify output to file: {e}")


def main():
    print("============================================================")
    print("UMTAS UP PDF Parser Verification & Interactive Tester")
    print("============================================================")
    
    # Prompt for file path
    file_path = input("Enter path to UP schedule PDF file (or type 'T' to run automated test suite): ").strip()
    
    test_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "up_test_pdfs")

    # If they choose the automated test suite
    if file_path.upper() == 'T':
        run_automated_tests(test_dir)
        return 0
    
    if not file_path:
        if os.path.exists(test_dir):
            pdf_files = sorted([f for f in os.listdir(test_dir) if f.lower().endswith('.pdf')])
            if pdf_files:
                print("\nNo path entered. Available test files in up_test_pdfs/ folder:")
                for idx, name in enumerate(pdf_files):
                    print(f"  [{idx + 1}] {name}")
                print(f"  [T] Run verification test suite (Outputs JSON subsets for AI verification)")
                choice = input(f"Select a file (1-{len(pdf_files)}) or T: ").strip()
                if choice.upper() == 'T':
                    run_automated_tests(test_dir)
                    return 0
                elif choice.isdigit() and 1 <= int(choice) <= len(pdf_files):
                    file_path = os.path.join(test_dir, pdf_files[int(choice) - 1])
                else:
                    print("Cancelled.")
                    return 0
            else:
                print(f"No PDFs found in default test folder: {test_dir}")
                return 1
        else:
            print("No path entered and default test folder not found.")
            return 1

    if not os.path.exists(file_path):
        print(f"Error: File not found at path '{file_path}'")
        return 1

    print(f"\nParsing file: {file_path}")
    parser = UPPDFParser()
    try:
        raw_result = parser.parse(file_path)
        print(f"✓ Detected Schedule Type: {raw_result['type']}")
        
        # Format and process events
        processed_events = process_events(raw_result['events'])
        
        # Prepare the final JSON structure returned in base parse schema
        final_json = {
            "events": processed_events,
            "type": raw_result["type"]
        }
        
        print(f"✓ Extracted {len(processed_events)} rows.")
        
        print("\nRow-by-Row Output:")
        for idx, event in enumerate(processed_events):
            print_event(idx, event)
            
        print("\n" + "=" * 60)
        print("Full Base JSON Result Structure:")
        print("=" * 60)
        import json
        print(json.dumps(final_json, indent=2))
        
        print("\n" + "=" * 60)
        print("Verification complete.")
        print("=" * 60)
        return 0

    except Exception as e:
        print(f"✗ Parsing failed with error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())

