#ifndef GA_H
#define GA_H

#include "../../lib/openGA.hpp"
#include "../data/GA-data/chromosome.h"
#include <vector>

typedef EA::Genetic<EventChromosome, ChromMiddleCost> GA_type;
typedef EA::GenerationType<EventChromosome, ChromMiddleCost> Generation_Type;
class GA_Handler {
private:
  API_DATA initData;
  GA_type gaEngine;

  void InitGA();
  void InitMap();
  void InitOverlap();
  void InitMutationMap();

public:
  GA_Handler(API_DATA);
  // a global unordered map will be placed for each module and occurences
  EventChromosome findSolution();
};

void init_genes(EventChromosome &p, const std::function<double(void)> &rnd01);
bool eval_solution(const EventChromosome &p, ChromMiddleCost &c);

EventChromosome mutate(const EventChromosome &p,
                       const std::function<double(void)> &rnd01,
                       double shrink_scale);

EventChromosome crossover(const EventChromosome &X1, const EventChromosome &X2,
                          const std::function<double(void)> &rnd01);

double calculate_SO_total_fitness(
    const EA::ChromosomeType<EventChromosome, ChromMiddleCost> &c);

void SO_report_generation(
    int generation_number,
    const EA::GenerationType<EventChromosome, ChromMiddleCost> &last_generation,
    const EventChromosome &best_genes);

double Overlap_Heuristic(EventChromosome event);

bool CountPattern(EventChromosome chrom);
void resetTemp();
void resetCollision();
int roundDownSlot(int time);
int roundUpSlot(int time);
string timeSlot(int time);
std::vector<string> slotEval(int timeStart, int timeEnd);

struct eventsOccurring {
  string eventType;
  string moduleCode;
  std::vector<int> indices;
  eventsOccurring(){};
  eventsOccurring(string type, string code)
      : eventType(type), moduleCode(code) {}
};
// make a map of modulecode
// on mutation -> pick current event -> if number of occurrences > 1
// then we do another check we pick a random chromosome index that != current
// and flip that.

#endif
