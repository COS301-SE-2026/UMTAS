#include "event.h"
#include "nlohmann/json.hpp"
#include <sstream>
#include <string>

#include <stdexcept>
static const string GROUPING_KEY = "events";
const string EventGA::DAY_KEY = "day";
const string EventGA::EVENT_ID = "eventID";
const string EventGA::MODULE_CODE = "moduleCode";
const string EventGA::EVENT_START = "startTime";
const string EventGA::EVENT_END = "endTime";

Day dayHelper(string);
int timeHelper(string);
bool typeCheckHelper(string key, json &obj);

EventGA::EventGA(json eventsJson) {
  try {
    if (typeCheckHelper(DAY_KEY, eventsJson)) {
      this->eventDay = dayHelper(eventsJson[DAY_KEY]);
    }

    if (typeCheckHelper(EVENT_ID, eventsJson)) {
      this->eventID = eventsJson[EVENT_ID];
    }

    if (typeCheckHelper(MODULE_CODE, eventsJson)) {
      this->moduleCode = eventsJson[MODULE_CODE];
    }

    if (typeCheckHelper(EVENT_START, eventsJson)) {
      this->event_start = timeHelper(eventsJson[EVENT_START]);
    }
    if (typeCheckHelper(EVENT_END, eventsJson)) {
      this->event_end = timeHelper(eventsJson[EVENT_END]);
    }
  } catch (std::runtime_error &e) {
    throw std::runtime_error(e.what());
  }
  this->is_active = false;
}
bool typeCheckHelper(string key, json &obj) {
  if (obj.contains(key) && obj[key].is_string()) {
    return true;
  } else {
    throw std::runtime_error(key + "is not defined or is not a string");
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

int timeHelper(const std::string &time) {
  int hours, minutes;
  char colon;
  std::istringstream iss(time);
  iss >> hours >> colon >> minutes; // time format hh:mm
  return hours * 60 + minutes;
}

std::vector<EventGA> EventGA::initArray(json eventJson) {
  std::vector<EventGA> retEvents;
  try {
    if (eventJson.is_array()) {
      for (auto &event : eventJson) {
        retEvents.push_back(EventGA(event));
      }
      return retEvents;
    } else {
      throw std::runtime_error("key:" + GROUPING_KEY +
                               " Is not an array init Events");
    }
  } catch (const std::runtime_error &e) {
    throw std::runtime_error(e.what());
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
