#pragma once
#include <vector>
#include "Coalition.h"
#include <string>

using std::vector;
class Agent;

class JoinPolicy
{
public:
    virtual ~JoinPolicy() = default;
    virtual void chooseCol(vector<int> req,Party &p,Simulation &s) = 0;
    virtual JoinPolicy* cloneMe() = 0;
};

class MandatesJoinPolicy : public JoinPolicy
{
public:
    virtual ~MandatesJoinPolicy() = default;
    virtual void chooseCol(vector<int> req,Party &p,Simulation &s);
    virtual JoinPolicy* cloneMe() override;
};

class LastOfferJoinPolicy : public JoinPolicy
{
public:
    virtual ~LastOfferJoinPolicy() = default;
    virtual void chooseCol(vector<int> req,Party &p,Simulation &s);
    virtual JoinPolicy* cloneMe() override;
};