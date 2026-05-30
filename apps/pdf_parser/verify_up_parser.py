import os
import sys

# Ensure apps/pdf_parser is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from parser import UPPDFParser, process_events


def print_event(idx: int, event: dict):
    print(f"\n--- Row {idx + 1} ---")
    for key, val in event.items():
        print(f"  {key:<15}: {val}")


def main():
    print("============================================================")
    print("UMTAS UP PDF Parser Verification & Interactive Tester")
    print("============================================================")
    
    # Prompt for file path
    file_path = input("Enter path to UP schedule PDF file: ").strip()
    
    # If they press enter, list the files in up_test_pdfs directory and let them choose one
    test_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "up_test_pdfs")
    
    if not file_path:
        if os.path.exists(test_dir):
            pdf_files = sorted([f for f in os.listdir(test_dir) if f.lower().endswith('.pdf')])
            if pdf_files:
                print("\nNo path entered. Available test files in up_test_pdfs/ folder:")
                for idx, name in enumerate(pdf_files):
                    print(f"  [{idx + 1}] {name}")
                choice = input(f"Select a file (1-{len(pdf_files)}) or press Enter to cancel: ").strip()
                if choice.isdigit() and 1 <= int(choice) <= len(pdf_files):
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

