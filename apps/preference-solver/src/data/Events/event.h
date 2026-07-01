#include "../../../lib/nlohmann/json.hpp"
#include <iostream>
#include <string>
#include <vector>
using nlohmann::json;
using std::cout;
using std::endl;
using std::string;
struct EventGA {
  string eventDay;
  string eventID;
  string moduleCode;
  string eventType;
  int event_start;
  int event_end;
  bool is_active;
  EventGA &operator=(const EventGA &event);
  EventGA(json eventsJson);
  static std::vector<EventGA> initEvents(const json& eventReq);
  static const string GROUPING_KEY;
  static const string DAY_KEY;
  static const string EVENT_ID;
  static const string MODULE_CODE;
  static const string EVENT_START;
  static const string EVENT_END;
  static const string EVENT_TYPE;
  // automatically sets is active to false
};
