#include <string>
#include <iostream>
#include <vector>
#include "openGA.hpp"
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
    EventGA()
    {
    }

    EventGA(const EventGA &event)
    {
        this->eventDay = event.eventDay;
        this->eventID = event.eventID;
        this->event_start = event.event_start;
        this->event_end = event.event_end;
        this->is_active = event.is_active;
        this->moduleCode = event.moduleCode;
    }
    EventGA &operator=(const EventGA &event)
    {
        if (this == &event)
        {
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
};

struct ModuleGA
{
    string moduleCode;
    int number_Occur;
    ModuleGA()
    {
    }
};

struct API_DATA
{
    API_DATA()
    {
    }
    std::vector<ModuleGA> modules;
    std::vector<EventGA> events;
    int targetTime;
};

struct EventChromosome
{
    std::vector<EventGA> events;
    int targetTime;
    EventChromosome()
    {
    }

    EventChromosome(const EventChromosome &chrom)
    {
        this->events.resize(chrom.events.size());
        int index = 0;
        for (EventGA event : chrom.events)
        {
            this->events[index++] = event;
        }
    }

    EventChromosome &operator=(const EventChromosome &chrom)
    {
        if (this == &chrom)
        {
            return *this;
        }
        this->events.resize(chrom.events.size());
        int index = 0;
        for (EventGA event : chrom.events)
        {
            this->events[index++] = event;
        }
        return *this;
    }
};
struct ChromMiddleCost
{
    double penalty_score;
};
