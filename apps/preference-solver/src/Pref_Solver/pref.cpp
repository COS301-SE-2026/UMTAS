#include "pref.h"

GA_PREF::GA_PREF(GA_Data &data)
{
    this->targetTime = data.targetTime;
    try
    {
        setModuleData(data.modules);
        CreateEventChromosome(data.events);
    }
    catch (const std::exception &e)
    {
        std::cerr << e.what() << '\n';
    }
}

bool GA_PREF::setModuleData(std::vector<ModuleGA> modules)
{
    for (const ModuleGA &module : modules)
    {
        if (numOccurences.find(module.moduleCode) != numOccurences.end())
        {
            throw std::runtime_error("Failed to set number of occurences, module " + module.moduleCode + " is listed twice");
        }
        else
        {
            numOccurences.insert({module.moduleCode, module.number_Occur});
        }
    }
    return true;
}
// makes a chromosome to be used that has all events false.
bool GA_PREF::CreateEventChromosome(std::vector<EventGA> events)
{
    this->copyChromosome.events.resize(events.size());
    int index = 0;
    for (EventGA &event : events)
    {
        event.is_active = false;
        copyChromosome.events[index++] = event;
    }
}