#include <string>
#include <iostream>
#include <vector>
using std::cout;
using std::endl;
using std::string;

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

// Listed with GA since there may be a direct mapping from json required later to a struct
struct EventGA
{
    Day eventDay;
    string eventID;
    string moduleCode;
    int event_start;
    int event_end;
    bool is_active;
};

struct ModuleGA
{
    string moduleCode;
    int number_Occur;
    
};

struct GA_Data
{
    std::vector<ModuleGA> modules;
    std::vector<EventGA> events;
    int targetTime;
};

struct EventChromosome
{
    std::vector<EventGA> events;
};
