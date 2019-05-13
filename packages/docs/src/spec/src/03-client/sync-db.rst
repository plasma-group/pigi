######
SyncDB
######

***
API
***

Methods
=======

setSyncedBlockNumber
--------------------

.. code-block:: typescript

   async function setSyncedBlockNumber(
     blockNumber: number
   ): Promise<void>

Description
^^^^^^^^^^^
Sets the latest block up to which the user has synchronized their local state with the state of the operator.

Parameters
^^^^^^^^^^
1. ``blockNumber`` - ``number``: Block up to which the user has synchronized.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the block number has been updated.

getSyncedBlockNumber
--------------------

.. code-block:: typescript

   async function getSyncedBlockNumber(): Promise<number>

Description
^^^^^^^^^^^
Queries the latest block up to which the client has synchronized with the operator.

Returns
^^^^^^^
``Promise<number>``: Block up to which the client has synchronized.

