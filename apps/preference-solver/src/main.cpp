#include "../lib/openGA.hpp"
#include "Pref_Solver/types.h"

void init_genes(
    EventChromosome &p,
    const std::function<double(void)> &rnd01);
bool eval_solution(
    const EventChromosome &p,
    ChromMiddleCost &c);

EventChromosome mutate(
    const EventChromosome &p,
    const std::function<double(void)> &rnd01,
    double shrink_scale);

EventChromosome crossover(
    const EventChromosome &X1,
    const EventChromosome &X2,
    const std::function<double(void)> &rnd01);

int main()
{
    typedef EA::Genetic<EventChromosome, ChromMiddleCost> GA_type;
    typedef EA::GenerationType<EventChromosome, ChromMiddleCost> Generation_Type;

    GA_type ga_obj;
    ga_obj.init_genes = init_genes;
    ga_obj.eval_solution = eval_solution;
    ga_obj.mutate = mutate;
    ga_obj.crossover = crossover;

    return 0;
}
void init_genes(
    EventChromosome &p,
    const std::function<double(void)> &rnd01)
{
    // a variable will be updated to set the chromosome to follow the chosen structure.
    for (auto &event : p.events)
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
    c.penalty_score = 0;
    return true;
}

EventChromosome mutate(
    const EventChromosome &p,
    const std::function<double(void)> &rnd01,
    double shrink_scale)
{
    int size = p.events.size();
    double mutate = 1 / size;
    EventChromosome newChrom = p;

    for (int i = 0; i < newChrom.events.size(); i++)
    {
        if (rnd01() < mutate)
        {
            newChrom.events[i].is_active = !newChrom.events[i].is_active;
        }
    }
    return newChrom;
}

// classic crossover meets outs needs better
EventChromosome crossover(
    const EventChromosome &X1,
    const EventChromosome &X2,
    const std::function<double(void)> &rnd01)
{

    EventChromosome child;

    child.events.resize(X1.events.size());
    float r = rnd01();
    int crossOverPt = r * child.events.size();

    if (crossOverPt == child.events.size())
    {
        --crossOverPt;
    }
    else if (crossOverPt == 0)
    {
        ++crossOverPt;
    }

    for (int i = 0; i < child.events.size(); i++)
    {
        if (i < crossOverPt)
        {
            child.events[i].is_active = X1.events[i].is_active;
        }
        else
        {
            child.events[i].is_active = X2.events[i].is_active;
        }
    }
    return child;
}
