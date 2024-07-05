#pragma once


class Agent;
class Party;
class Simulation;

class SelectionPolicy {
    public:
    bool isItFirstOffer(Agent &me,Party &p,Simulation &s) const;
    virtual ~SelectionPolicy() = default;
    virtual void makeOffer(Agent &me,Simulation &s) = 0;
    virtual SelectionPolicy* cloneMe() = 0;
 };

class MandatesSelectionPolicy: public SelectionPolicy{
    public:
    ~MandatesSelectionPolicy() = default;
    virtual void makeOffer(Agent &me,Simulation &s);
    virtual SelectionPolicy* cloneMe() override;

 };

class EdgeWeightSelectionPolicy: public SelectionPolicy{
    public:
     ~EdgeWeightSelectionPolicy() = default;
    virtual void makeOffer(Agent &me,Simulation &s);
    virtual SelectionPolicy* cloneMe() override;
 };
