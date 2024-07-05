#pragma once
#include <string>
#include "Agent.h"
#include <vector>

using std::string;
using std::vector;
class JoinPolicy;
class Simulation;

enum State
{
    Waiting,
    CollectingOffers,
    Joined
};

class Party
{
public:
    Party(int id, string name, int mandates, JoinPolicy *); 
    ~Party();                                     //destructor
    Party(const Party& other);                    //copy constructor 
    Party& operator=(const Party& other);         //copy assignment operator
    Party(Party&& other) noexcept;                //move constructor
    Party& operator=(Party&& other) noexcept;     //move assignment operator
    State getState() const;
    void setState(State state);
    int getMandates() const;
    void step(Simulation &s);
    const string &getName() const;
    int getId() const;
    void submitAnOffer(int agentId);
    vector<int> &getOffers();

    

private:
    int mId;
    string mName;
    int mMandates;
    JoinPolicy *mJoinPolicy;
    State mState;
    int timer;
    vector<int> offers;
};
