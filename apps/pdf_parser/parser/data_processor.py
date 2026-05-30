from typing import List, Dict, Any
import re


def process_events(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Cleans, normalizes, and validates a list of parsed schedule events.
    Standardizes day names, parses times into start/end times, and formats event summaries.
    """
    processed_events = []
    
    for raw_event in events:
        # Shallow copy to avoid mutating input structure
        event = raw_event.copy()

        # 1. Standardize Day Names (e.g. "Monday", "Tuesday")
        if 'Day' in event and event['Day']:
            event['Day'] = event['Day'].strip().capitalize()

        # 2. Validate and Clean Time Format into start_time and end_time
        # Check 'Time' (used in Lectures and Tests)
        time_str = event.get('Time') or event.get('Start Time')
        
        if time_str:
            time_str = time_str.strip()
            
            # Match range format (HH:MM - HH:MM)
            time_match = re.search(r'(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})', time_str)
            if time_match:
                event['start_time'] = time_match.group(1)
                event['end_time'] = time_match.group(2)
            else:
                # Match single time format (HH:MM) - commonly Exams
                single_time_match = re.search(r'(\d{2}:\d{2})', time_str)
                if single_time_match:
                    event['start_time'] = single_time_match.group(1)
                    
                    # For exams / single times, default to a 3-hour duration
                    start_hour, start_min = map(int, event['start_time'].split(':'))
                    end_hour = (start_hour + 3) % 24
                    event['end_time'] = f"{end_hour:02d}:{start_min:02d}"
                else:
                    # Invalid time format, omit start_time and end_time
                    pass

        # 3. Create event summaries and recurrence info
        if 'Module' in event:
            if 'Test' in event and event['Test']:
                # Test event
                event['summary'] = f"{event['Module']} {event['Test']}"
                event['isRecurring'] = False
            elif 'Activity' in event and event['Activity']:
                # Lecture or Exam
                event['summary'] = f"{event['Module']} {event['Activity']}"
                # If there's a day of the week, it's a weekly lecture (recurring)
                event['isRecurring'] = 'Day' in event and bool(event['Day'])
            else:
                event['summary'] = event['Module']
                event['isRecurring'] = False
        else:
            event['summary'] = "Unnamed Event"
            event['isRecurring'] = False

        # 4. Add location mapping if venue is present
        if 'Venue' in event and event['Venue']:
            event['location'] = event['Venue']

        processed_events.append(event)

    return processed_events
