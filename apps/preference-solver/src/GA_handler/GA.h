#include "../../lib/openGA.hpp"
#include "../data/GA-data/chromosome.h"

typedef EA::Genetic<EventChromosome, ChromMiddleCost> GA_type;
typedef EA::GenerationType<EventChromosome, ChromMiddleCost> Generation_Type;
class GA_Handler {
private:
  API_DATA initData;
  GA_type gaEngine;

  void InitGA();
  void InitMap();
  void InitOverlap();

public:
  GA_Handler(API_DATA);
  // a global unordered map will be placed for each module and occurences
  EventChromosome findSolution();
};

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

double Overlap_Heuristic( EventChromosome event);

bool CountPattern(EventChromosome chrom);
void resetTemp();
void resetCollision();
int roundDownSlot(int time);
int roundUpSlot(int time);
string timeSlot(int time);
std::vector<string> slotEval(int timeStart, int timeEnd);