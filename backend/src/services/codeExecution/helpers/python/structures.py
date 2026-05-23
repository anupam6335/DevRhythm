import json
from collections import deque

# ----------------------------------------------------------------------
# ListNode Helpers
# ----------------------------------------------------------------------
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def deserialize_linked_list(arr):
    """Convert a JSON array into a linked list."""
    if not arr:
        return None
    head = ListNode(arr[0])
    curr = head
    for val in arr[1:]:
        curr.next = ListNode(val)
        curr = curr.next
    return head

def serialize_linked_list(head):
    """Convert a linked list into a JSON array."""
    res = []
    curr = head
    while curr:
        res.append(curr.val)
        curr = curr.next
    return res

# ----------------------------------------------------------------------
# TreeNode Helpers (level‑order with nulls)
# ----------------------------------------------------------------------
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def deserialize_tree(arr):
    """Convert a level‑order JSON array (with nulls) into a binary tree."""
    if not arr:
        return None
    nodes = [TreeNode(v) if v is not None else None for v in arr]
    kids = nodes[::-1]
    root = kids.pop()
    for node in nodes:
        if node:
            if kids:
                node.left = kids.pop()
            if kids:
                node.right = kids.pop()
    return root

def serialize_tree(root):
    """Convert a binary tree into a level‑order JSON array (with nulls)."""
    if not root:
        return []
    q = deque([root])
    res = []
    while q:
        node = q.popleft()
        if node:
            res.append(node.val)
            q.append(node.left)
            q.append(node.right)
        else:
            res.append(None)
    # Remove trailing nulls
    while res and res[-1] is None:
        res.pop()
    return res

# ----------------------------------------------------------------------
# Generic Node – supports both graph and random list
# The type of Node is determined by the presence of 'neighbors' vs 'random'.
# We provide both deserializers; the generator will call the appropriate one.
# ----------------------------------------------------------------------
class Node:
    def __init__(self, val=0, neighbors=None, next=None, random=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []
        self.next = next
        self.random = random

def deserialize_graph(adj_list):
    """Convert adjacency list JSON into a graph Node (1‑based indexing)."""
    if not adj_list:
        return None
    nodes = {}
    for i, neighbors in enumerate(adj_list):
        node_val = i + 1
        if node_val not in nodes:
            nodes[node_val] = Node(node_val)
        for nb_val in neighbors:
            if nb_val not in nodes:
                nodes[nb_val] = Node(nb_val)
            nodes[node_val].neighbors.append(nodes[nb_val])
    return nodes[1] if nodes else None

def serialize_graph(node):
    """Convert a graph Node into adjacency list JSON."""
    if not node:
        return []
    visited = set()
    order = []
    q = deque([node])
    while q:
        cur = q.popleft()
        if cur.val in visited:
            continue
        visited.add(cur.val)
        order.append(cur)
        for nb in cur.neighbors:
            if nb.val not in visited:
                q.append(nb)
    order.sort(key=lambda n: n.val)
    mapping = {n: i+1 for i, n in enumerate(order)}  # 1‑based index
    res = []
    for n in order:
        neighbor_vals = [mapping[nb] for nb in n.neighbors]
        res.append(neighbor_vals)
    return res

def deserialize_random_list(arr):
    """Convert a JSON array of [val, random_index] pairs into a random‑list Node."""
    if not arr:
        return None
    nodes = [Node(pair[0]) for pair in arr]
    for i in range(len(nodes)-1):
        nodes[i].next = nodes[i+1]
    for i, pair in enumerate(arr):
        if pair[1] is not None:
            nodes[i].random = nodes[pair[1]]
    return nodes[0] if nodes else None

def serialize_random_list(head):
    """Convert a random‑list Node into a JSON array of [val, random_index] pairs."""
    if not head:
        return []
    index = {}
    cur = head
    idx = 0
    while cur:
        index[cur] = idx
        cur = cur.next
        idx += 1
    res = []
    cur = head
    while cur:
        random_index = index.get(cur.random) if cur.random else None
        res.append([cur.val, random_index])
        cur = cur.next
    return res

# ----------------------------------------------------------------------
# NestedInteger Helpers
# ----------------------------------------------------------------------
class NestedInteger:
    def __init__(self, value=None):
        self.value = value
        self.list = []

    def isInteger(self):
        return self.value is not None

    def getInteger(self):
        return self.value

    def setInteger(self, value):
        self.value = value
        self.list = []

    def add(self, ni):
        self.list.append(ni)

    def getList(self):
        return self.list

def deserialize_nested_integer(data):
    """Convert a JSON value (int or list) into a NestedInteger."""
    if isinstance(data, int):
        return NestedInteger(data)
    elif isinstance(data, list):
        ni = NestedInteger()
        for item in data:
            ni.add(deserialize_nested_integer(item))
        return ni
    else:
        return NestedInteger()

def serialize_nested_integer(ni):
    """Convert a NestedInteger into a JSON value (int or list)."""
    if ni.isInteger():
        return ni.getInteger()
    else:
        return [serialize_nested_integer(child) for child in ni.getList()]

# ----------------------------------------------------------------------
# General collection helpers (List, Dict, Tuple, Set) – they mostly pass through
# but are kept for consistency.
# ----------------------------------------------------------------------
def deserialize_list(obj):
    return obj

def deserialize_dict(obj):
    return obj

def deserialize_tuple(obj):
    return obj

def deserialize_set(obj):
    return obj

# ----------------------------------------------------------------------
# The following function is a generic dispatcher for Node deserialization.
# It tries to detect whether the input is a graph adjacency list or a random list.
# ----------------------------------------------------------------------
def deserialize_node(obj):
    """Auto‑detect Node type: graph (adjacency list) or random list."""
    if not obj:
        return None
    # If it's a list of lists and the inner lists have length 2 and second element is an int or None -> random list
    if (isinstance(obj, list) and len(obj) > 0 and
        isinstance(obj[0], list) and len(obj[0]) == 2 and
        (isinstance(obj[0][1], int) or obj[0][1] is None)):
        return deserialize_random_list(obj)
    # Otherwise treat as graph adjacency list
    return deserialize_graph(obj)

def serialize_node(node):
    """Auto‑detect Node type: graph or random list, and serialize accordingly."""
    if not node:
        return []
    # Check if node has 'random' attribute (distinct from None) that indicates random list
    if hasattr(node, 'random') and (node.random is not None or getattr(node, 'next', None) is not None):
        return serialize_random_list(node)
    else:
        return serialize_graph(node)