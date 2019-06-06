####################
Merkle Interval Tree
####################

**********
Background
**********
The `Plasma Cashflow`_ construction requires transactions that can efficiently reference `ranges of state objects`_ simultaneously. In order to preserve the properties of `Plasma Cash`_, we require a Merkle tree structure that will not allow for the existence of two transactions that reference the same state object.

We provide a construction for such a tree, called a Merkle Interval Tree. This tree effectively commits to values that refer to corresponding ranges given by a ``start`` and an ``end``. The tree provides the property that for any range, there can exist at most **one** leaf node that references the range and has a valid Merkle proof.

**************
Tree Structure
**************
The Merkle Interval Tree is a `binary tree`_ with special structures for leaf nodes and internal nodes.

Leaf Node
=========
The leaf nodes in a Merkle Interval Tree represent a **range** and a value for that range. We describe leaf nodes as a tuple of ``(start, end, data)``.

In TypeScript:

.. code-block:: typescript

   interface MerkleIndexTreeLeafNode {
     start: number
     end: number
     data: string
   }

Internal Node
=============
Internal nodes are a tuple of ``(index, hash)``.

In TypeScript:

.. code-block:: typescript

   interface MerkleIndexTreeInternalNode {
     index: number
     hash: string
   }

***************
Tree Generation
***************
A Merkle Index tree is generated from a list of `leaf nodes`_. Merkle Interval Tree generation also requires the use of a `hash function`_. Any hash function is suitable, but the security properties of the hash function will impact the properties of the tree.

An algorithm for generating the tree is described below. All lists used are zero-indexed.

The algorithm takes two inputs, a list of leaf nodes and a hash function.

1. If the list of leaf nodes is empty, return an empty array.
2. Assert that the range described by ``start`` and ``end`` of each leaf node does not intersect with the range described by any other leaf node. If any intersecting ranges exist, throw an error.
3. Sort the list of leaf nodes by their ``start`` value.
4. Store the list of leaf nodes as the first layer of the tree.
5. Generate a corresponding sorted list of `internal nodes`_ from the leaf nodes by creating an internal for each leaf node such that:

   a) The ``index`` of the node is equal to the ``start`` of the leaf node.
   b) The ``hash`` of the node is equal to the hash of the concatenation of ``start``, ``end``, and ``data`` of the leaf node, in that order.
   
6. Recursively generate the rest of the tree as follows:

   a) Store the list of internal nodes at the current height of the tree.
   b) If the list of internal nodes has only one element, return.
   c) Pair each node in the list of internal nodes such that any node where ``node_index % 2 = 0`` is paired with the node at ``node_index + 1``. If the node at ``node_index + 1`` does not exist, pair the node with a new node such that ``pair.index = node.index`` and ``pair.hash = 0``.
   d) Generate a list of parent nodes. For each pair of nodes, create a corresponding parent node such that:
   
      1. ``parent.index = left_child.index`` and ``parent.hash`` is the hash of the concatenation of ``left_child.index``, ``left_child.hash``, ``right_child.index``, ``right_child.hash``, in that order.
      
   e) Repeat this process for the generated list of parent nodes.
   
7. Return the generated tree.
   
Pseudocode
==========
A pseudocode version of the above algorithm is given below:

.. code-block:: python

   def generate_tree(leaf_nodes, hash_function):
       tree = []
       
       # Empty tree
       if len(leaf_nodes) == 0:
           return tree
       
       # Leaves intersect
       for leaf in leaf_nodes:
           for other in leaf_nodes:
               if (intersects(leaf, other)):
                   raise Exception()
      
       # Sort the leaves by start value
       leaf_nodes.sort()
      
       children = []
       for leaf in leaf_nodes:
           children.append({
               'index': leaf.start,
               'hash': hash_function(leaf.start + leaf.end + leaf.data)
           })
   
   def generate_internal_nodes(children, tree):
       if len(children) == 1:
           return tree
       
       parents = []
       for x in range(0, len(children)):
           if x % 2 == 0:
               left_child = chilren[x]
 
               # Create an imaginary node if out of bounds
               if x + 1 == len(children):
                   right_child = {
                       'index': left_child.index,
                       'hash': 0
                   }
               else:
                   right_child = children[x + 1]
 
               parents.append({
                   'index': left_child.index,
                   'hash': hash_function(left_child.index + left_child.hash + right_child.index + right_child.hash)
               })
       
       tree.append(parents)
       return generate_internal_nodes(parents, tree)

*************
Merkle Proofs
*************
Our tree generation process allows us to create an efficient **proof** that for a given leaf node and a given Merkle Interval Tree root node such that:

1. The leaf node was contained in the tree that generated the root.
2. The range described by the leaf node intersects with no other ranges described by any other leaf node in the tree.

Proof Generation
================
Proofs can be generated after the full Merkle tree has been generated as per the algorithm `described above`_. Proofs consist of a list of `internal nodes`_ within the Merkle tree.

The proof for a given leaf node is computed as follows:

1. If the leaf node is not in the tree, throw an error.
2. Find the internal node that corresponds to the leaf node in the bottom-most level of the tree.
3. Recursively:

   a) If the internal node is the root node, return.
   b) Find the sibling of the node. If no sibling exists, set the sibling to the empty node such that ``sibling.index = node.index`` and ``sibling.hash = 0``.
   c) Insert the sibling into the proof.
   d) Repeat this process with the parent of the node.
   
4. Return the proof.

Pseudocode
----------

.. code-block:: python

   def generate_proof(tree, leaf_node):
       leaves = tree[0]
       if leaf_node not in leaves:
           raise Exception()
       
       leaf_index = leaves.index(leaf_node)
       return find_siblings(tree, 1, leaf_index, [])
   
   def find_siblings(tree, height, child_index, proof):
       if height == len(tree):
           return proof
       
       proof.append(get_sibling(child_index))
       parent_index = get_parent_index(child_index)
       return find_siblings(tree, height + 1, parent_index, proof)

Proof Verification
==================
Verification of Merkle Interval Tree proofs is relatively straightforward. Given a leaf node, the index of that leaf node within the Merkle tree, a proof consisting of a list `internal nodes`_, and the root of the tree:

1. Compute the internal node that corresponds to the leaf node such that ``node.index = leaf.start`` and ``node.hash`` is the hash of the concatenation of ``leaf.start``, ``leaf.end``, and ``leaf.data``, in that order.
2. For each element of the proof:

   a) Use the index of the leaf node to determine whether the element is a left or right sibling of the current internal node.
   b) Compute the parent of the two siblings.
   c) Set the current internal node to be the parent.
   
3. Check if the current internal node is equal to the root node.

Pseudocode
----------

.. code-block:: python

   def check_proof(leaf_node, leaf_index, proof, root_node, hash_function):
       current_node = {
           'index': leaf_node.start,
           'hash': hash_function(leaf_node.start + leaf_node.end + leaf_node.data)
       }
 
       for x in range(0, len(proof)):
           sibling = proof[x]
           if is_left_sibling(leaf_index, x):
               current_node = compute_parent(sibling, current_node)
           else:
               current_node = compute_parent(current_node, sibling)
      
       return current_node == root_node

************
Tree Diagram
************
A diagram of the Merkle Interval Tree is provided below. We've highlighted the nodes that one would need to provide to prove inclusion of a given state update.

.. raw:: html

   <img src="../../_static/images/merkle-interval-tree/merkle-interval-tree.svg" alt="Merkle Interval Tree">


.. References

.. _`described above`: #tree-generation
.. _`ranges of state objects`: ./state-object-ranges.html
.. _`internal nodes`: https://en.wikipedia.org/wiki/Tree_(data_structure)#external_node_(not_common)
.. _`hash function`: https://en.wikipedia.org/wiki/Hash_function
.. _`leaf nodes`: https://en.wikipedia.org/wiki/Tree_(data_structure)#leaf
.. _`binary tree`: https://en.wikipedia.org/wiki/Binary_tree
.. _`Plasma Cash`: https://www.learnplasma.org/en/learn/cash.html
.. _`Plasma Cashflow`: https://hackmd.io/DgzmJIRjSzCYvl4lUjZXNQ?view#
