#include "event.h"
const string EventGA::DAY_KEY = "day";
const string EventGA::EVENT_ID = "eventID";
const string EventGA::MODULE_CODE = "moduleCode";
const string EventGA::EVENT_START = "event_start";
const string EventGA::EVENT_END = "event_end";

EventGA::EventGA(json eventsJson) {}

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
