#include <string>
#include <iostream>
#include <vector>
#include "types.h"
#include <unordered_map>

using std::cout;
using std::endl;
using std::string;

class GA_PREF
{
private:
    int targetTime;
    std::unordered_map<string, int> numOccurences;
    // finds how many times module code should occcur

public:
    GA_PREF(GA_Data &data);

private:
    bool setModuleData(GA_Data &data);
};