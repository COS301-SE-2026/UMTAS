#include "event.h"
EventGA::EventGA(string json) {
    
}

EventGA &EventGA::operator=(const EventGA &event) {
  if (this == &event) {
    return *this;
  }
  this->eventDay = event.eventDay;
  this->eventID = event.eventID;
  this->event_start = event.event_start;
  this->event_end = event.event_end;
  this->is_active = event.is_active;
  this->moduleCode = event.moduleCode;
  return *this;
}
