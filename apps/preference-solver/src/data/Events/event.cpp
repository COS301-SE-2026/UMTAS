#include "event.h"
#include <ctime>
#include <stdexcept>
static const string GROUPING_KEY = "events";
const string EventGA::DAY_KEY = "day";
const string EventGA::EVENT_ID = "eventID";
const string EventGA::MODULE_CODE = "moduleCode";
const string EventGA::EVENT_START = "startTime";
const string EventGA::EVENT_END = "endTime";

Day dayHelper(string);
EventGA::EventGA(json eventsJson) {
  if (eventsJson.contains(DAY_KEY) && eventsJson[DAY_KEY].is_string()) {
    this->eventDay = dayHelper(eventsJson[DAY_KEY]);
  } else {
    throw std::runtime_error(DAY_KEY + "is not defined or is not a string");
  }
  if (eventsJson.contains(EVENT_ID) && eventsJson[EVENT_ID].is_string()) {
    this->eventDay = eventsJson[EVENT_ID];
  } else {
    throw std::runtime_error(EVENT_ID + "is not defined or is not a string");
  }
  if (eventsJson.contains(MODULE_CODE) && eventsJson[MODULE_CODE].is_string()) {
    this->eventDay = eventsJson[MODULE_CODE];
  } else {
    throw std::runtime_error(EVENT_ID + "is not defined or is not a string");
  }
}
Day dayHelper(string day) {
  if (day == "monday") {
    return Day::MONDAY;
  } else if (day == "tuesday") {
    return Day::TUESDAY;
  } else if (day == "wednesday") {
    return Day::WEDNESDAY;
  } else if (day == "thursday") {
    return Day::THURSDAY;
  } else if (day == "friday") {
    return Day::FRIDAY;
  } else if (day == "saturday") {
    return Day::SATURDAY;
  } else if (day == "sunday") {
    return Day::SUNDAY;
  } else {
    throw std::runtime_error(day + " is not one of the accepted days");
  }
}

std::vector<EventGA> EventGA::initArray(json eventJson) {
  std::vector<EventGA> retEvents;

  if (eventJson.is_array()) {
    for (auto &event : eventJson) {
      retEvents.push_back(EventGA(event));
    }
    return retEvents;
  } else {
    throw std::runtime_error("key:" + GROUPING_KEY +
                             " Is not an array init Events");
  }
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
