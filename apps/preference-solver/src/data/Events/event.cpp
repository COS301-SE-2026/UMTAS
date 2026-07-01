#include "event.h"
#include "nlohmann/json.hpp"
#include <sstream>
#include <string>

#include <stdexcept>
const string EventGA::GROUPING_KEY = "events";
const string EventGA::DAY_KEY = "day";
const string EventGA::EVENT_ID = "eventID";
const string EventGA::MODULE_CODE = "moduleCode";
const string EventGA::EVENT_START = "startTime";
const string EventGA::EVENT_END = "endTime";
const string EventGA::EVENT_TYPE = "EventType";

int timeHelper(const std::string &);
bool typeCheckHelper(string key, json &obj);

EventGA::EventGA(json eventsJson) {
  try {
    if (typeCheckHelper(DAY_KEY, eventsJson)) {
      this->eventDay = eventsJson[DAY_KEY].get<string>();
    }

    if (typeCheckHelper(EVENT_ID, eventsJson)) {
      this->eventID = eventsJson[EVENT_ID].get<string>();
    }

    if (typeCheckHelper(MODULE_CODE, eventsJson)) {
      this->moduleCode = eventsJson[MODULE_CODE].get<string>();
    }

    if (typeCheckHelper(EVENT_START, eventsJson)) {
      this->event_start = timeHelper(eventsJson[EVENT_START].get<string>());
    }
    if (typeCheckHelper(EVENT_END, eventsJson)) {
      this->event_end = timeHelper(eventsJson[EVENT_END].get<string>());
    }
    if (typeCheckHelper(EVENT_TYPE, eventsJson)) {
      this->eventType = eventsJson[EVENT_TYPE];
    }

  } catch (std::runtime_error &e) {
    throw std::runtime_error(e.what());
  }
  this->is_active = false;
}

std::vector<EventGA> EventGA::initEvents(const json &eventJson) {
  std::vector<EventGA> retEvents;
  try {
    if (eventJson.is_array()) {
      for (auto &event : eventJson) {
        if (event.is_object())
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

// helpers
bool typeCheckHelper(string key, json &obj) {
  if (obj.contains(key) && obj[key].is_string()) {
    return true;
  } else {
    throw std::runtime_error(key + "is not defined or is not a string");
  }
}

int timeHelper(const string &time) {
  int hours, minutes;
  char colon;
  std::istringstream iss(time);
  iss >> hours >> colon >> minutes; // time format hh:mm
  return hours * 60 + minutes;
}
