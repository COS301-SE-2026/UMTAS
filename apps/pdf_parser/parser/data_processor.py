from typing import List, Dict, Any
import re


def process_events(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Cleans, normalizes, and validates a list of parsed schedule events.
    Standardizes day names, parses times into start/end times, and formats event summaries.
    """
    processed_events = []

    hour = r"(?:[01]?\d|2[0-3])"
    minute = r"[0-5]\d"
    time = rf"{hour}:{minute}"
    time_boundary = r"(?<!\d)"
    time_end_boundary = r"(?!\d)"
    time_range = rf"{time_boundary}({time})\s*-\s*({time}){time_end_boundary}"
    single_time = rf"{time_boundary}({time}){time_end_boundary}"
    
    for raw_event in events:
        event = raw_event.copy()

        if 'Day' in event and event['Day']:
            event['Day'] = event['Day'].strip().capitalize()

        time_str = event.get('Time') or event.get('Start Time')
        
        if time_str:
            time_str = time_str.strip()
            
            time_match = re.search(time_range, time_str)
            if time_match:
                event['start_time'] = time_match.group(1)
                event['end_time'] = time_match.group(2)
            else:
                single_time_match = re.search(single_time, time_str)
                if single_time_match:
                    event['start_time'] = single_time_match.group(1)
                    
                    start_hour, start_min = map(int, event['start_time'].split(':'))
                    end_hour = (start_hour + 3) % 24
                    event['end_time'] = f"{end_hour:02d}:{start_min:02d}"

        if 'Module' in event:
            if 'Test' in event and event['Test']:
                event['summary'] = f"{event['Module']} {event['Test']}"
                event['isRecurring'] = False
            elif 'Activity' in event and event['Activity']:
                event['summary'] = f"{event['Module']} {event['Activity']}"
                event['isRecurring'] = 'Day' in event and bool(event['Day'])
            else:
                event['summary'] = event['Module']
                event['isRecurring'] = False
        else:
            event['summary'] = "Unnamed Event"
            event['isRecurring'] = False

        event['location'] = event.get('Venue') if event.get('Venue') else None

        processed_events.append(event)

    return processed_events
