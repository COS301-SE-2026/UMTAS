#ifndef CP_H
#define CP_H

#include <vector>

#include "../data/API/API-data.h";

// CPModelBuilder, BoolVar, LinearExpr
#include "ortools/sat/cp_model.h"
// Solve
#include "ortools/sat/cp_model_solver.h"
// CpSolverResponse, CpSolverStatus
#include "ortools/sat/cp_model.pb.h"

//model
using operations_research::sat::CpModelBuilder;
//solution
using operations_research::sat::CpSolverResponse;
//Boolean variable for solver
using operations_research::sat::BoolVar;
//used to sum variables
using operations_research::sat::LinearExpr;
//run the solver
using operations_research::sat::Solve;


class CP_SOLVER {

    private:
    //CP SAT solver model
    CpModelBuilder model;

    //Input data consisting of modules + events
    API_DATA inputData;

    // inputData's vector of modules
    const std::vector<ModuleGA>& modules;
    //inputData's vector of events
    const std::vector<EventGA>& events;

    //Is event at i chosen or not - Main variable used by solver
    std::vector<BoolVar> selectEvent;

    //create the bool vector for events: 1 to 1 mapping
    std::vector<BoolVar> createSelectEventVector(const std::vector<EventGA>& inVec);

    //Create and assign rules to model
    void createRules();


    //helpertjies

    // Apply occurance rules for events to model
    void occuranceRule();

    //Apply overlap rule for events to model
    void overlapRule();

    public:
    //constr
    CP_SOLVER(API_DATA& data);


};

#endif//CP_H