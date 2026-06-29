#include "../lib/openGA.hpp"
#include "Pref_Solver/types.h"
int main()
{
    typedef EA::Genetic<EventChromosome, ChromMiddleCost> GA_type;
    typedef EA::GenerationType<EventChromosome, ChromMiddleCost> Generation_Type;

    return 0;
}
void init_genes(
    EventChromosome &p,
    const std::function<double(void)> &rnd01);

bool eval_solution(
    const EventChromosome &p,
    ChromMiddleCost &c);

EventChromosome mutate(
    const EventChromosome &p,
    const std::function<double(void)> &rnd01,
    double mutation_rate,
    double shrink_scale);

EventChromosome crossover(
    const EventChromosome &X1,
    const EventChromosome &X2,
    const std::function<double(void)> &rnd01);
