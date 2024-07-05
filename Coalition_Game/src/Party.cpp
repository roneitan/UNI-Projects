#include "JoinPolicy.h"
#include "../include/Party.h"

class JoinPolicy;

Party::Party(int id, string name, int mandates, JoinPolicy *jp) : mId(id), mName(name), mMandates(mandates), mJoinPolicy(jp),
 mState(Waiting),timer(0),offers()
{   
    
}

//destructor
Party::~Party(){
    delete mJoinPolicy;
}                     

//copy constructor 
Party::Party(const Party& other):mId(other.mId), mName(other.mName), mMandates(other.mMandates), mJoinPolicy(other.mJoinPolicy->cloneMe()),
 mState(other.mState),timer(other.timer),offers(vector<int>(other.offers)){
}            

//copy assignment operator
Party& Party:: operator=(const Party& other){
    if (this != &other){
        mId = other.mId;
        mName = other.mName;
        mMandates = other.mMandates;
        *mJoinPolicy = *other.mJoinPolicy;
        mState = other.mState;
        timer = other.timer;
        offers = vector<int>(other.offers);
        }
    return *this;
}

//move constructor
Party::Party(Party&& other) noexcept : mId(other.mId), mName(other.mName), mMandates(other.mMandates),mJoinPolicy(other.mJoinPolicy),
 mState(other.mState),timer(other.timer), offers(std::move(other.offers)){
    other.mJoinPolicy = nullptr;
}         

//move assignment operator
Party& Party:: operator=(Party&& other) noexcept {
    if (this != &other){
        delete mJoinPolicy;
        mName = other.mName;
        mId = other.mId;
        mMandates = other.mMandates;
        mJoinPolicy = other.mJoinPolicy;
        mState = other.mState;
        timer = other.timer;
        offers = std::move(other.offers);
        other.mJoinPolicy = nullptr;
    }
    return *this;
}         

State Party::getState() const
{
    return mState;
}

void Party::setState(State state)
{
    mState = state;
}

int Party::getMandates() const
{
    return mMandates;
}

const string & Party::getName() const
{
    return mName;
}

void Party::step(Simulation &s)
{   
    if(getState() == CollectingOffers){
        timer++;
        if(timer == 3){
        mJoinPolicy->chooseCol(offers,*this,s);
        setState(Joined);
        offers.clear();
    }
    }    
}

int Party::getId() const{
    return mId;
}

vector<int> &Party::getOffers(){
    return offers;
}

void Party::submitAnOffer(int agentId){
    offers.push_back(agentId);
}


