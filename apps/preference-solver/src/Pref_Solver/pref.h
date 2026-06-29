#include <string>
#include <iostream>
#include <vector>
using std::cout;
using std::endl;
using std::string;

class GA_PREF
{
};
enum Day
{
    MONDAY,
    TUEDAY,
    WEDNESDAY,
    THURSDAY,
    FRIDAY,
    SATURDAY,
    SUNDAY
};

struct Event
{
    Day eventDay;
    string eventID ;
    string moduleCode;
    int event_start;
    int event_end;
};

struct Module
{
    string moduleCode;
    int number_Occur;
    std::vector<Event> events;
};
struct GA_Data
{
    std::vector<Module> modules;
    int targetTime;
};