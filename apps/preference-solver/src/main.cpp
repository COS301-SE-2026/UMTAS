#include "../lib/openGA.hpp"
#include "data/API/API-data.h"
/*
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

double calculate_SO_total_fitness(const EA::ChromosomeType<EventChromosome,
ChromMiddleCost> &c);

void SO_report_generation(
    int generation_number,
    const EA::GenerationType<EventChromosome, ChromMiddleCost> &last_generation,
    const EventChromosome &best_genes);

EventChromosome copyChrom;

int main()
{
    typedef EA::Genetic<EventChromosome, ChromMiddleCost> GA_type;
    typedef EA::GenerationType<EventChromosome, ChromMiddleCost>
Generation_Type;

    GA_type gaEngine;
    gaEngine.init_genes = init_genes;
    gaEngine.eval_solution = eval_solution;
    gaEngine.mutate = mutate;
    gaEngine.crossover = crossover;
    gaEngine.calculate_SO_total_fitness = calculate_SO_total_fitness;
    gaEngine.SO_report_generation = SO_report_generation;
    copyChrom.events.resize(10);

    gaEngine.solve();

    return 0;
}
void init_genes(
    EventChromosome &p,
    const std::function<double(void)> &rnd01)
{
    // a variable will be updated to set the chromosome to follow the chosen
structure. p = copyChrom; for (auto &event : p.events)
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
    if (size > 0)
    {
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
double calculate_SO_total_fitness(const EA::ChromosomeType<EventChromosome,
ChromMiddleCost> &c)
{

    return -c.middle_costs.penalty_score;
}

void SO_report_generation(
    int generation_number,
    const EA::GenerationType<EventChromosome, ChromMiddleCost> &last_generation,
    const EventChromosome &best_genes)
{
    std::cout << "Generation " << generation_number << std::endl;
}
*/

int main() {
  string inputData = "";
  API_DATA data(inputData);
}
