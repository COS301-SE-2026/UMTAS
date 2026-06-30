#include <string>
#include <iostream>
#include "../API/day.h"
using std::cout;
using std::endl;
using std::string;

struct EventGA
{
    Day eventDay;
    string eventID;
    string moduleCode;
    int event_start;
    int event_end;
    bool is_active;
    EventGA &operator=(const EventGA &event);
    EventGA(string json);
};