##################
MerkleIntervalTree
##################

***********
Description
***********
Our plasma implementation uses a special Merkle tree called a `Merkle Interval Tree`_. This page describes the interface for an implementation of the tree.

-------------------------------------------------------------------------------

***************
Data Structures
***************

MerkleIntervalTreeLeafNode
--------------------------

.. code-block:: typescript

   interface MerkleIntervalTreeLeafNode {
     start: number
     end: number
     data: string
   }

Description
^^^^^^^^^^^
Represents a leaf node in the tree.

Fields
^^^^^^
1. ``start`` - ``number``: Start of the range this leaf node covers.
2. ``end`` - ``number``: End of the range this leaf node covers.
3. ``data`` - ``string``: Arbitrary data held by the leaf node.

-------------------------------------------------------------------------------

MerkleIntervalTreeInternalNode
------------------------------

.. code-block:: typescript

   interface MerkleIntervalTreeInternalNode {
     index: number
     hash: string
   }

Description
^^^^^^^^^^^
Represents an internal node in the interval tree.

Fields
^^^^^^
1. ``index`` - ``number``: Index value of the node's left child.
2. ``hash`` - ``string``: Hash of the node's children.

***
API
***

Methods
=======

getInclusionProof
-----------------

.. code-block:: typescript

   function getInclusionProof(
     leaf: MerkleIntervalTreeLeafNode
   ): Promise<MerkleIntervalTreeInternalNode[]>

Description
^^^^^^^^^^^
Generates an `inclusion proof`_ for a given leaf node.


Parameters
^^^^^^^^^^
1. ``leaf`` - ``MerkleIntervalTreeLeafNode``: Leaf node to generate a proof for.

Returns
^^^^^^^
``MerkleIntervalTreeInternalNode[]``: List of internal nodes that form the inclusion proof.

-------------------------------------------------------------------------------

checkInclusionProof
-------------------

.. code-block:: typescript

   function checkInclusionProof(
     leaf: MerkleIntervalTreeLeafNode,
     leafIndex: number,
     root: MerkleIntervalTreeInternalNode,
     inclusionProof: MerkleIntervalTreeInternalNode[]
   ): boolean

Description
^^^^^^^^^^^
Checks an inclusion proof for a given leaf node.

Parameters
^^^^^^^^^^
1. ``leaf`` - ``MerkleIntervalTreeLeafNode``: Leaf node to check inclusion for.
2. ``leafIndex`` - ``number``: Index of the leaf node in the list of leaf nodes.
3. ``root`` - ``MerkleIntervalTreeInternalNode``: Root of the Merkle Interval Tree.
4. ``inclusionProof`` - ``MerkleIntervalTreeInternalNode[]``: List of internal nods that form the inclusion proof.

Returns
^^^^^^^
``boolean``: ``true`` if the proof is valid, ``false`` otherwise.

.. _`Merkle Interval Tree`: TODO

