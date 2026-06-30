#include "../Events/event.h"
#include "../Modules/module.h"
#include <vector>
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
