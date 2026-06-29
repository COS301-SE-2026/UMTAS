#include "pref.h"

GA_PREF::GA_PREF()
{
}

std::unordered_map<string, int> &GA_PREF::setModuleData(const std::vector<ModuleGA> &modules)
{
    std::unordered_map<string, int> numOccurences;
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
    return numOccurences;
}
// makes a chromosome to be used that has all events false.
EventChromosome &GA_PREF::CreateEventChromosome(std::vector<EventGA> &events)
{
    EventChromosome copyChromosome;
    int index = 0;
    for (EventGA &event : events)
    {
        event.is_active = false;
        copyChromosome.events[index++] = event;
    }
    return copyChromosome;
}

EventChromosome GA_PREF::StartGA(GA_DATA &data)
{
}

void init_genes(
    EventChromosome &p,
    const std::function<double(void)> &rnd01)
{
    for (auto event : p.events)
    {
        if (rnd01() >= 0.5)
        {
            event.is_active = true;
        }
    }
}

bool eval_solution(
    const EventChromosome &p,
    ChromMiddleCost &c)
{
    
}

EventChromosome mutate(
    const EventChromosome &p,
    const std::function<double(void)> &rnd01,
    double mutation_rate,
    double shrink_scale);

EventChromosome crossover(
    const EventChromosome &X1,
    const EventChromosome &X2,
    const std::function<double(void)> &rnd01);
