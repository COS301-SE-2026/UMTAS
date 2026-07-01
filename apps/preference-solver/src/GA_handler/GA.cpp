#include "GA.h"
#include "../../lib/openGA.hpp"
#include <unordered_map>

std::unordered_map<string, int> modulesMap;
std::unordered_map<string, int> tempMap;
// makes a key of module:event -> occurences
// also have a local structure that will do the same however its meant to be
// overwritten

EventChromosome copyChrom;
// this will be overwritten

GA_Handler::GA_Handler(API_DATA data) {
  this->initData = data;
  copyChrom = EventChromosome(data);
  InitGA();
}
void GA_Handler::InitGA() {

  // init functions
  gaEngine.init_genes = init_genes;
  gaEngine.eval_solution = eval_solution;
  gaEngine.mutate = mutate;
  gaEngine.crossover = crossover;
  gaEngine.calculate_SO_total_fitness = calculate_SO_total_fitness;
  gaEngine.SO_report_generation = SO_report_generation;
  // init functions

  // DD setup
  gaEngine.problem_mode = EA::GA_MODE::SOGA;
  gaEngine.generation_max = 200;
  gaEngine.population = 100;
  gaEngine.multi_threading = true;
  gaEngine.crossover_fraction = 0.7;
  gaEngine.mutation_rate = 0.1;
  gaEngine.verbose = true;
}

EventChromosome GA_Handler::findSolution() {
  gaEngine.solve();
  int index = gaEngine.last_generation.best_chromosome_index;
  return gaEngine.last_generation.chromosomes[index].genes;
}

void init_genes(EventChromosome &p, const std::function<double(void)> &rnd01) {
  p = copyChrom;
  for (auto &event : p.events) {
    if (rnd01() >= 0.5) {
      event.is_active = true;
    }
  }
}
bool eval_solution(const EventChromosome &p, ChromMiddleCost &c) {}

EventChromosome mutate(const EventChromosome &p,
                       const std::function<double(void)> &rnd01,
                       double shrink_scale) {
  int size = p.events.size();
  if (size > 0) {
    double mutatePer = 1 / (double)size;
    EventChromosome newChrom = p;

    for (int i = 0; i < newChrom.events.size(); i++) {
      if (rnd01() < mutatePer) {
        newChrom.events[i].is_active = !newChrom.events[i].is_active;
      }
    }
    return newChrom;
  }
}

EventChromosome crossover(const EventChromosome &X1, const EventChromosome &X2,
                          const std::function<double(void)> &rnd01);

double calculate_SO_total_fitness(
    const EA::ChromosomeType<EventChromosome, ChromMiddleCost> &c) {}

void SO_report_generation(
    int generation_number,
    const EA::GenerationType<EventChromosome, ChromMiddleCost> &last_generation,
    const EventChromosome &best_genes) {}
