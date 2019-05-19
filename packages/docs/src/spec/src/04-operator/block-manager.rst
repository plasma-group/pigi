############
BlockManager
############

***********
Description
***********

.. todo::

   Add description for block manager.

-------------------------------------------------------------------------------


***
API
***

Methods
=======

getNextBlockNumber
------------------

.. code-block:: typescript

   async function getNextBlockNumber(): Promise<number>

Description
^^^^^^^^^^^
Gets the number of the **next** block to be published.

Returns
^^^^^^^
``Promise<number>``: Number of the next block to be published.

-------------------------------------------------------------------------------


enqueueStateUpdate
------------------

.. code-block:: typescript

   async function enqueueStateUpdate(
     stateUpdate: StateUpdate
   ): Promise<void>

Description
^^^^^^^^^^^
Adds a state update to the queue of updates to be added to the next block.

Parameters
^^^^^^^^^^
1. ``stateUpdate`` - ``StateUpdate``: State update to add to the queue.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the state update has been added to the queue.

-------------------------------------------------------------------------------


getPendingStateUpdates
----------------------

.. code-block:: typescript

   async function getPendingStateUpdates(): Promise<StateUpdate[]>

Description
^^^^^^^^^^^
Gets the list of state updates that are pending for inclusion in the next block.

Returns
^^^^^^^
``Promise<StateUpdate[]>``: List of state updates queued for inclusion in the next block.

-------------------------------------------------------------------------------


submitNextBlock
---------------

.. code-block:: typescript

   async function submitNextBlock(): Promise<void>

Description
^^^^^^^^^^^
`Merklizes the next block`_ and sends the header to Ethereum.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the block has been submitted.

.. _`Merklizes the next block`: TODO

