#ifndef STRUCTURES_H
#define STRUCTURES_H

#include <iostream>
#include <vector>
#include <string>
#include <map>
#include <queue>
#include <memory>
#include <sstream>
#include <algorithm>
#include <cctype>

// ----------------------------------------------------------------------
// ListNode
// ----------------------------------------------------------------------
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

static ListNode* deserializeListNode(const std::vector<JsonValue>& arr) {
    if (arr.empty()) return nullptr;
    ListNode* head = new ListNode((int)arr[0].asNumber());
    ListNode* cur = head;
    for (size_t i = 1; i < arr.size(); ++i) {
        cur->next = new ListNode((int)arr[i].asNumber());
        cur = cur->next;
    }
    return head;
}

static JsonValue serializeListNode(ListNode* head) {
    std::vector<JsonValue> res;
    while (head) {
        res.push_back(JsonValue((double)head->val));
        head = head->next;
    }
    return JsonValue(res);
}

// ----------------------------------------------------------------------
// TreeNode
// ----------------------------------------------------------------------
struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

static TreeNode* deserializeTreeNode(const std::vector<JsonValue>& arr) {
    if (arr.empty()) return nullptr;
    std::vector<TreeNode*> nodes;
    for (const auto& elem : arr) {
        if (elem.isNull()) nodes.push_back(nullptr);
        else nodes.push_back(new TreeNode((int)elem.asNumber()));
    }
    int i = 0, j = 1;
    while (j < (int)nodes.size()) {
        if (nodes[i]) {
            nodes[i]->left = nodes[j++];
            if (j < (int)nodes.size()) nodes[i]->right = nodes[j++];
        }
        i++;
    }
    return nodes[0];
}

static JsonValue serializeTreeNode(TreeNode* root) {
    std::vector<JsonValue> res;
    std::queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        TreeNode* node = q.front(); q.pop();
        if (node) {
            res.push_back(JsonValue((double)node->val));
            q.push(node->left);
            q.push(node->right);
        } else {
            res.push_back(JsonValue()); // null
        }
    }
    while (!res.empty() && res.back().isNull()) res.pop_back();
    return JsonValue(res);
}

// ----------------------------------------------------------------------
// NestedInteger
// ----------------------------------------------------------------------
class NestedInteger {
private:
    int value;
    std::vector<NestedInteger> list;
    bool isInt;
public:
    NestedInteger() : isInt(false) {}
    NestedInteger(int val) : value(val), isInt(true) {}
    bool isInteger() const { return isInt; }
    int getInteger() const { return value; }
    void setInteger(int val) { value = val; isInt = true; list.clear(); }
    void add(const NestedInteger& ni) { list.push_back(ni); }
    const std::vector<NestedInteger>& getList() const { return list; }
};

static NestedInteger deserializeNestedInteger(const JsonValue& val) {
    if (val.isNumber()) {
        return NestedInteger((int)val.asNumber());
    } else if (val.isArray()) {
        NestedInteger ni;
        for (const auto& elem : val.asArray()) {
            ni.add(deserializeNestedInteger(elem));
        }
        return ni;
    }
    return NestedInteger();
}

static JsonValue serializeNestedInteger(const NestedInteger& ni) {
    if (ni.isInteger()) {
        return JsonValue((double)ni.getInteger());
    } else {
        std::vector<JsonValue> arr;
        for (const auto& child : ni.getList()) {
            arr.push_back(serializeNestedInteger(child));
        }
        return JsonValue(arr);
    }
}

// ----------------------------------------------------------------------
// Node (supports both graph and random list)
// ----------------------------------------------------------------------
struct Node {
    int val;
    std::vector<Node*> neighbors;
    Node* next;
    Node* random;

    Node() : val(0), next(nullptr), random(nullptr) {}
    Node(int _val) : val(_val), next(nullptr), random(nullptr) {}
    Node(int _val, std::vector<Node*> _neighbors) : val(_val), neighbors(_neighbors), next(nullptr), random(nullptr) {}
    Node(int _val, Node* _next, Node* _random) : val(_val), next(_next), random(_random) {}
};

// Graph versions
static Node* deserializeGraphNode(const JsonValue& val) {
    if (!val.isArray()) return nullptr;
    auto adj = val.asArray();
    if (adj.empty()) return nullptr;
    std::map<int, Node*> nodes;
    for (size_t i = 0; i < adj.size(); ++i) {
        int nodeVal = (int)i + 1;
        if (!nodes.count(nodeVal)) nodes[nodeVal] = new Node(nodeVal);
        auto neighbors = adj[i].asArray();
        for (const auto& nb : neighbors) {
            int nbVal = (int)nb.asNumber();
            if (!nodes.count(nbVal)) nodes[nbVal] = new Node(nbVal);
            nodes[nodeVal]->neighbors.push_back(nodes[nbVal]);
        }
    }
    return nodes[1];
}

static JsonValue serializeGraphNode(Node* node) {
    if (!node) return JsonValue();
    std::map<Node*, int> idx;
    std::vector<Node*> order;
    std::queue<Node*> q;
    q.push(node);
    while (!q.empty()) {
        Node* cur = q.front(); q.pop();
        if (idx.count(cur)) continue;
        idx[cur] = (int)order.size();
        order.push_back(cur);
        for (Node* nb : cur->neighbors) q.push(nb);
    }
    std::sort(order.begin(), order.end(), [](Node* a, Node* b) { return a->val < b->val; });
    std::vector<std::vector<int>> res;
    for (Node* n : order) {
        std::vector<int> nbVals;
        for (Node* nb : n->neighbors) nbVals.push_back(idx[nb] + 1);
        res.push_back(nbVals);
    }
    return serializeIntVectorVector(res);
}

// Random list versions
static Node* deserializeRandomListNode(const JsonValue& val) {
    if (!val.isArray()) return nullptr;
    auto arr = val.asArray();
    if (arr.empty()) return nullptr;
    std::vector<Node*> nodes;
    for (const auto& pair : arr) {
        auto pairArr = pair.asArray();
        int nodeVal = (int)pairArr[0].asNumber();
        nodes.push_back(new Node(nodeVal));
    }
    for (size_t i = 0; i < nodes.size() - 1; ++i) {
        nodes[i]->next = nodes[i+1];
    }
    for (size_t i = 0; i < arr.size(); ++i) {
        auto pairArr = arr[i].asArray();
        if (pairArr.size() >= 2 && !pairArr[1].isNull()) {
            int randomIdx = (int)pairArr[1].asNumber();
            nodes[i]->random = nodes[randomIdx];
        }
    }
    return nodes.empty() ? nullptr : nodes[0];
}

static JsonValue serializeRandomListNode(Node* head) {
    if (!head) return JsonValue();
    std::map<Node*, int> index;
    Node* cur = head;
    int idx = 0;
    while (cur) {
        index[cur] = idx++;
        cur = cur->next;
    }
    std::vector<JsonValue> res;
    cur = head;
    while (cur) {
        std::vector<JsonValue> pair;
        pair.push_back(JsonValue((double)cur->val));
        if (cur->random && index.count(cur->random))
            pair.push_back(JsonValue((double)index[cur->random]));
        else
            pair.push_back(JsonValue());
        res.push_back(JsonValue(pair));
        cur = cur->next;
    }
    return JsonValue(res);
}

// Auto-detection for Node
static Node* deserializeNode(const JsonValue& val) {
    if (!val.isArray()) return nullptr;
    auto arr = val.asArray();
    if (arr.empty()) return nullptr;
    // Heuristic: if first element is an array of length 2 and second element is number or null -> random list
    if (arr[0].isArray()) {
        auto first = arr[0].asArray();
        if (first.size() == 2 && (first[1].isNumber() || first[1].isNull())) {
            return deserializeRandomListNode(val);
        }
    }
    return deserializeGraphNode(val);
}

static JsonValue serializeNode(Node* node) {
    if (!node) return JsonValue();
    // Heuristic: if node has a 'next' field (non‑null) treat as random list
    if (node->next != nullptr) {
        return serializeRandomListNode(node);
    } else {
        return serializeGraphNode(node);
    }
}

// ----------------------------------------------------------------------
// Collection helpers (for vector<int>, vector<vector<int>>, vector<string>)
// ----------------------------------------------------------------------
static std::vector<int> deserializeIntVector(const JsonValue& val) {
    std::vector<int> res;
    if (!val.isArray()) return res;
    for (const auto& elem : val.asArray()) {
        res.push_back((int)elem.asNumber());
    }
    return res;
}

static JsonValue serializeIntVector(const std::vector<int>& vec) {
    std::vector<JsonValue> res;
    for (int v : vec) res.push_back(JsonValue((double)v));
    return JsonValue(res);
}

static std::vector<std::vector<int>> deserializeIntVectorVector(const JsonValue& val) {
    std::vector<std::vector<int>> res;
    if (!val.isArray()) return res;
    for (const auto& row : val.asArray()) {
        res.push_back(deserializeIntVector(row));
    }
    return res;
}

static JsonValue serializeIntVectorVector(const std::vector<std::vector<int>>& vec) {
    std::vector<JsonValue> res;
    for (const auto& row : vec) {
        res.push_back(serializeIntVector(row));
    }
    return JsonValue(res);
}

static std::vector<std::string> deserializeStringVector(const JsonValue& val) {
    std::vector<std::string> res;
    if (!val.isArray()) return res;
    for (const auto& elem : val.asArray()) {
        if (elem.isString()) res.push_back(elem.asString());
        else res.push_back("");
    }
    return res;
}

static JsonValue serializeStringVector(const std::vector<std::string>& vec) {
    std::vector<JsonValue> res;
    for (const std::string& s : vec) res.push_back(JsonValue(s));
    return JsonValue(res);
}

#endif // STRUCTURES_H