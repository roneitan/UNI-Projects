#pragma once
#include <vector>
#include "Party.h"

using std::vector;
class Party;
class Simulation;

class Graph
{
public:
    Graph(vector<Party> vertices, vector<vector<int>> edges);
    int getMandates(int partyId) const;
    int getEdgeWeight(int v1, int v2) const;
    int getNumVertices() const;
    const Party &getParty(int partyId) const;
    const vector <int> getNeighbors(int partyId)const;
    void sendOffer(int partyId, int agentId);
    void partyStep(int partyId,Simulation &s);

private:
    vector<Party> mVertices;
    vector<vector<int>> mEdges;
};
