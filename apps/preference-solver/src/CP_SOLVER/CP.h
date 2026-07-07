#ifndef CP_H
#define CP_H

#include "../data/API/API-data.h"

#include <vector>

// CPModelBuilder, BoolVar, LinearExpr
#include "ortools/sat/cp_model.h"
// CpSolverResponse, CpSolverStatus
#include "ortools/sat/cp_model.pb.h"
// Solve
#include "ortools/sat/cp_model_solver.h"

// satParameters -> to enumerate all solutions
// #include "ortools/sat/sat_parameters.pb.h"

//model
using operations_research::sat::CpModelBuilder;
//Boolean variable for solver
using operations_research::sat::BoolVar;
//used to sum variables
using operations_research::sat::LinearExpr;
//solution
using operations_research::sat::CpSolverResponse;
using operations_research::sat::CpSolverStatus;
using operations_research::sat::SolutionBooleanValue;
//run the solver
using operations_research::sat::Solve;

//For the multiple solutions response
// using operations_research::sat::Model;
// using operations_research::sat::SatParameters;
// using operations_research::sat::NewSatParameters;
// using operations_research::sat::NewFeasibleSolutionObserver;
// using operations_research::sat::SolveCpModel;
//


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

        //Create and assign rules to model
        void createRules();

        //create the bool vector for events: 1 to 1 mapping
        std::vector<BoolVar> createSelectEventVector(const std::vector<EventGA>& inVec);

        //helpertjies

        // Apply occurance rules for events to model
        void occuranceRule();

        //Apply overlap rule for events to model
        void overlapRule();

    public:
        //constr
        CP_SOLVER(API_DATA& data);

        //Get single feasible solution
        std::vector<EventGA> solve();

        //Run CP-solver in mode to return all possible feasible solutions
        // std::vector<std::vector<EventGA>> solveAll();

        //Takes in bool vector and returns vector of events chosen as active
        std::vector<EventGA> applySolution(const std::vector<bool>& boolVec);
};

#endif//CP_H