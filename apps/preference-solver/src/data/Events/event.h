#include "../../../lib/nlohmann/json.hpp"
#include <iostream>
#include <string>
#include <vector>
using nlohmann::json;
using std::cout;
using std::endl;
using std::string;
struct EventGA {
  string dayOfWeek;
  string eventId;
  string moduleCode;
  string activityType;
  string activityCode;
  int event_start;
  int event_end;
  bool is_active;
  EventGA(json eventsJson);
  EventGA() {};

  static std::vector<EventGA> initEvents(const json &eventReq);
  static const string GROUPING_KEY;
  static const string DAY_OF_WEEK_KEY;
  static const string DATE_KEY;
  static const string EVENT_ID_KEY;
  static const string MODULE_CODE;
  static const string EVENT_START;
  static const string EVENT_END;
  static const string ACTIVITY_TYPE_KEY;
  static const string ACTIVITY_CODE_KEY;
  // automatically sets is active to false
};

struct DayOfWeek {
  const string Monday = "monday";
  const string Tuesday = "tuesday";
  const string Wednesday = "wednesday";
  const string Thursday = "thursday";
  const string Friday = "friday";
  const string Saturday = "saturday";
  const string Sunday = "sunday";

  static DayOfWeek getDayOfWeek() {
    static DayOfWeek days;
    return days;
  }

  const std::vector<string> getDaysArray() const {
    static std::vector<string> day = {Monday, Tuesday,  Wednesday, Thursday,
                                      Friday, Saturday, Sunday};

    return day;
  }
};

#pragma once
