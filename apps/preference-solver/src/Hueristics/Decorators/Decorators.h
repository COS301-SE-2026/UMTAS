#ifndef DECORATOR_H
#define DECORATOR_H

#include "baseHeuristic.h"
class H_Decorator: public  BaseHeuristic {

    BaseHeuristic * next =nullptr;
    void setNext(BaseHeuristic* next){
        this->next = next;
    }
    virtual ~H_Decorator(){}

};
#endif
