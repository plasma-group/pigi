#########
HistoryDB
#########

***********
Description
***********
``HistoryDB`` provides a simple interface to the set of historical `StateUpdate`_ objects. ``HistoryDB`` also stores all values necessary to prove the `history`_ of a given state object, including the `Merkle Interval Tree inclusion proofs`_ for each state update and the `transactions`_ that created those state updates.


-------------------------------------------------------------------------------

***
API
***

Methods
=======

getStateUpdate
--------------

.. code-block:: typescript

   async function getStateUpdate(
     stateUpdateHash: string
   ): Promise<StateUpdate>

Description
^^^^^^^^^^^
Queries a full state update from the hash of the state update.

Parameters
^^^^^^^^^^
1. ``stateUpdateHash`` - ``string``: `keccak256`_ hash of the state update.

Returns
^^^^^^^
``Promise<StateUpdate>``: Full state update that corresponds to the given hash.


-------------------------------------------------------------------------------

putStateUpdate
--------------

.. code-block:: typescript

   async function putStateUpdate(stateUpdate: StateUpdate): Promise<void>

Description
^^^^^^^^^^^
Adds a state update to the database.

Parameters
^^^^^^^^^^
1. ``stateUpdate`` - ``StateUpdate``: `StateUpdate`_ to add to the database.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the state update has been added to the database.


-------------------------------------------------------------------------------

getStateUpdateTransactions
--------------------------

.. code-block:: typescript

   getStateUpdateTransactions(
     stateUpdateHash: string
   ): Promise<Transaction[]>

Description
^^^^^^^^^^^
Queries the list of `Transaction`_ objects that created the given state update.

Parameters
^^^^^^^^^^
1. ``stateUpdateHash`` - ``string``: `keccak256`_ hash of the state update to query.

Returns
^^^^^^^
``Promise<Transaction[]>``: List of `Transaction`_ objects that created the given state update.

-------------------------------------------------------------------------------


putStateUpdateTransactions
--------------------------

.. code-block:: typescript

   async function putStateUpdateTransactions(
     stateUpdateHash: string,
     transactions: Transaction[]
   ): Promise<void>

Description
^^^^^^^^^^^
Stores the set of transactions that created a given state update.

Parameters
^^^^^^^^^^
1. ``stateUpdateHash`` - ``string``: `keccak256`_ hash of the state update to set transactions for.
2. ``transactions`` - ``Transaction[]``: List of transactions that created the given state update.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the transactions have been stored.

-------------------------------------------------------------------------------


getStateUpdateLeafPosition
--------------------------

.. code-block:: typescript

   async function getStateUpdateLeafPosition(
     stateUpdateHash: string
   ): Promise<number>

Description
^^^^^^^^^^^
Gets the `leaf position`_ of a given state update within the `Merkle Interval Tree`_ of the block in which the state update was included. 

Parameters
^^^^^^^^^^
1. ``stateUpdateHash`` - ``string``: `keccak256`_ hash of the state update to query.

Returns
^^^^^^^
``Promise<number>``: Leaf position of the given state update.

-------------------------------------------------------------------------------


putStateUpdateLeafPosition
--------------------------

.. code-block:: typescript

   async function putStateUpdateLeafPosition(
     stateUpdateHash: string,
     leafPosition: number
   ): Promise<void>

Description
^^^^^^^^^^^
Sets the leaf position for a given state update within the `Merkle Interval Tree`_ of the block in which the state update was included.

Parameters
^^^^^^^^^^
1. ``stateUpdateHash`` - ``string``: `keccak256`_ hash of the state update.
2. ``leafPosition`` - ``number``: Leaf position for the state update.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the leaf position has been set.

-------------------------------------------------------------------------------


getBlockStateUpdateCount
------------------------

.. code-block:: typescript

   async funtion getBlockStateUpdateCount(
     block: number
   ): Promise<number>

Description
^^^^^^^^^^^
Gets the number of state updates that occurred within a given block.

Parameters
^^^^^^^^^^
1. ``block`` - ``number``: Block to query.

Returns
^^^^^^^
``Promise<number>``: Number of state updates that occurred within the given block.

-------------------------------------------------------------------------------


putBlockStateUpdateCount
------------------------

.. code-block:: typescript

   async function putBlockStateUpdateCount(
     block: number,
     stateUpdateCount: number
   ): Promise<void>

Description
^^^^^^^^^^^
Sets the number of state updates that were included within a given block.

Parameters
^^^^^^^^^^
1. ``block`` - ``number``: Block to set a count for.
2. ``stateUpdateCount`` - ``number``: Number of state updates included within the specified block.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the state update count has been stored.

-------------------------------------------------------------------------------


getStateTreeNode
----------------

.. code-block:: typescript

   async function getStateTreeNode(
     block: number,
     nodeIndex: number
   ): Promise<MerkleIntervalStateTreeNode>

Description
^^^^^^^^^^^
Queries a node in the state tree.

Parameters
^^^^^^^^^^
1. ``block`` - ``number``: Block for which to query a node.
2. ``nodeIndex`` - ``number``: Index of the node to query.

Returns
^^^^^^^
``Promise<MerkleIntervalStateTreeNode>``: The `MerkleIntervalStateTreeNode`_ at the given block and node index.

-------------------------------------------------------------------------------


putStateTreeNode
----------------

.. code-block:: typescript

   async function putStateTreeNode(
     block: number,
     nodeIndex: number,
     node: MerkleIntervalStateTreeNode
   ): Promise<void>

Description
^^^^^^^^^^^
Adds a node to the `state tree`_ for a given block.

Parameters
^^^^^^^^^^
1. ``block`` - ``number``: Block to add a state tree node for.
2. ``nodeIndex`` - ``number``: Index of the node to insert.
3. ``node`` - ``MerkleIntervalStateTreeNode``: State tree node to add to the tree.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the node has been inserted into the tree.

-------------------------------------------------------------------------------


getAddressTreeNode
------------------

.. code-block:: typescript

   async function getAddressTreeNode(
     block: number,
     nodeIndex: number
   ): Promise<MerkleIntervalAddressTreeNode>

Description
^^^^^^^^^^^
Gets a node in the `address tree`_ of a given block.

Parameters
^^^^^^^^^^
1. ``block`` - ``number``: Block for which to query an address tree node.
2. ``nodeIndex`` - ``number``: Index of the node to query.

Returns
^^^^^^^
``Promise<MerkleIntervalAddressTreeNode>``: The `MerkleIntervalAddressTreeNode`_ at the given index for the specified block.

-------------------------------------------------------------------------------


putAddressTreeNode
------------------

.. code-block:: typescript

   async function putAddressTreeNode(
     block: number,
     nodeIndex: number,
     node: MerkleIntervalAddressTreeNode
   ): Promise<void>

Description
^^^^^^^^^^^
Sets a node in the `address tree`_ of a given block.

Parameters
^^^^^^^^^^
1. ``block`` - ``number``: Block for which to set an address tree node.
2. ``nodeIndex`` - ``number``: Index of the node in the address tree.
3. ``node`` - ``MerkleIntervalAddressTreeNode``: Node to insert into the tree.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the node has been added to the tree.


.. References

.. _`StateUpdate`: ../01-core/state-system.html#StateUpdate
.. _`transactions`: ../01-core/state-system.html#transactions
.. _`Transaction`: ../01-core/state-system.html#Transaction
.. _`Merkle Interval Tree`: ../01-core/merkle-interval-tree.html
.. _`Merkle Interval Tree inclusion proofs`: ../01-core/merkle-interval-tree.html#merkle-proofs
.. _`state tree`: ../01-core/double-layer-tree.html#state-tree
.. _`address tree`: ../01-core/double-layer-tree.html#address-tree
.. _`history`: ../03-client/history-proofs.html
.. _`keccak256`: https://ethereum.stackexchange.com/questions/550/which-cryptographic-hash-function-does-ethereum-use
.. _`MerkleIntervalStateTreeNode`: TODO
.. _`MerkleIntervalAddressTreeNode`: TODO
