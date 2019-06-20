###################
Commitment Contract
###################

***********
Description
***********
Each plasma chain **MUST** have at least one **commitment contract**. Commitment contracts hold the block headers for the plasma chain. Whenever the aggregator creates a new plasma block, they **MUST** publish this block to the commitment contract.


-------------------------------------------------------------------------------

***
API
***

Events
======

BlockSubmitted
--------------

.. code-block:: solidity

   event BlockSubmitted(
       uint256 _number,
       bytes _header
   );

Description
^^^^^^^^^^^
Emitted whenever a new block root has been published.

Fields
^^^^^^
1. ``_number`` - ``uint256``: Block number that was published.
2. ``_header`` - ``bytes``: Header for that block.

Rationale
^^^^^^^^^
Users need to know whenever a new block has been published so that they can stay in sync with the aggregator.


-------------------------------------------------------------------------------

Public Variables
================

currentBlock
------------

.. code-block:: solidity

   uint256 public currentBlock;

Description
^^^^^^^^^^^
Block number of the most recently published plasma block.

Rationale
^^^^^^^^^
Users need to know the current plasma block for various operations. Contract also needs to keep track of this so it knows what block is being published when ``submitBlock`` is called.


-------------------------------------------------------------------------------

blocks
------

.. code-block:: solidity

   mapping (uint256 => bytes) public blocks;

Description
^^^^^^^^^^^
Mapping from block number to block header.

Rationale
^^^^^^^^^
It's often important to be able to pull a specific block header given a block number. This is necessary, for example, when verifying `inclusion proofs`_.

Other implementations often represent this mapping as ``uint256 -> bytes32`` under the assumption that the block header will always be a ``bytes32`` Merkle tree root. We instead represent the mapping as ``uint256 -> bytes`` for more flexibility in the structure of the block root.


-------------------------------------------------------------------------------

Methods
=======

submitBlock
-----------

.. code-block:: solidity

   function submitBlock(bytes _header) public

Description
^^^^^^^^^^^
Allows a user to submit a block with the given header.

Parameters
^^^^^^^^^^
1. ``_header`` - ``bytes``: Block header to publish.

Rationale
^^^^^^^^^
It's obviously necessary to expose some functionality that allows a user to submit a block header. However, the rationale around authentication logic is more interesting here. 

Authentication in our original construction was handled by checking that msg.sender was the aggregator. This works well in a single-aggregator construction, but it doesn't work if we wanted some more complex system. In order to solve this problem, we initinally wanted to add a ``witness: bytes`` parameter to the method which could then be used to authenticate the submitted header. Fortunately, we stumbled on an even better solution.

Conveniently, if a contract calls another contract, then msg.sender within that second contract will be the address of the first contract. We can therefore outsource verification of a given block to some external contract and simply check that ``msg.sender`` is that contract.

Requirements
^^^^^^^^^^^^
- **SHOULD** authenticate the block header in some manner.
- **MUST** increment ``currentBlock`` by one.
- **MUST** store the block header in ``blocks`` at ``currentBlock``.
- **MUST** emit a ``BlockSubmitted`` event.


.. References
