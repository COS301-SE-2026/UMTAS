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

json EventGA::returnJson() const{
  json jsonObj;
  return {{DAY_KEY, this->eventDay},
          {EVENT_ID, this->eventID},
          {EVENT_START, minutesToTime(this->event_start)},
          {EVENT_END, minutesToTime(this->event_end)},
          {MODULE_CODE, this->moduleCode},
          {EVENT_TYPE, this->eventType}};
}

json EventGA::returnJsonVector(const std::vector<EventGA>& events) {

  json arr = json::array();
  for (const auto& e : events) {
      arr.push_back(e.returnJson());
  }
  return arr;
};

std::string minutesToTime(int minutesAfterMidnight) {
  int hours = minutesAfterMidnight / 60;
  int minutes = minutesAfterMidnight % 60;
  string hourPad = "";
  string minPad = "";
  if (hours < 10) {
    hourPad = '0';
  }
  if (minutes < 10) {
    minPad = '0';
  }
  std::ostringstream oss;
  oss << hourPad << hours << ":" << minPad << minutes;

  return oss.str();
}
