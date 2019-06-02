######
SyncDB
######

***********
Description
***********
``SyncDB`` is used by the `SyncManager`_ to store information about current synchronization statuses.

-------------------------------------------------------------------------------

***
API
***

Methods
=======

putLastSyncedBlock
------------------

.. code-block:: typescript

   async function putLastSyncedBlock(
     plasmaContract: string,
     block: number
   ): Promise<void>

Description
^^^^^^^^^^^
Sets the last block up to which the client has synchronized with a given plasma contract.

Parameters
^^^^^^^^^^
1. ``plasmaContract`` - ``string``: ID of the plasma chain to set last block for.
2. ``block`` - ``number``: Last block up to which the client has synchronized.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the block has been set.

getLastSyncedBlock
------------------

.. code-block:: typescript

   async function getLastSyncedBlock(plasmaContract: string): Promise<number>

Description
^^^^^^^^^^^
Gets the last block up to which the client has synchronized with a given plasma contract.

Parameters
^^^^^^^^^^
1. ``plasmaContract`` - ``string``: Contract to query the last synced block for.

Returns
^^^^^^^
``Promise<number>``: Block up to which the client has synchronized.

addSyncQuery
------------

.. code-block:: typescript

   async function addSyncQuery(
     plasmaContract: string,
     stateQuery: StateQuery
   ): Promise<void>

Description
^^^^^^^^^^^
Adds a `StateQuery`_ to the list of queries to execute for a given plasma contract.

Parameters
^^^^^^^^^^
1. ``plasmaContract`` - ``string``: Contract to add a query for.
2. ``stateQuery`` - ``StateQuery``: Query to add for the contract.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the query has been added.

removeSyncQuery
---------------

.. code-block:: typescript

   async function removeSyncQuery(
     plasmaContract: string,
     stateQuery: StateQuery
   ): Promise<void>

Description
^^^^^^^^^^^
Removes a `StateQuery`_ from the list of queries to execute for a given plasma contract.

Parameters
^^^^^^^^^^
1. ``plasmaContract`` - ``string``: Contract to remove a query for.
2. ``stateQuery`` - ``StateQuery``: Query to remove for the contract.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the query has been removed.

getSyncQueries
--------------

.. code-block:: typescript

   async function getSyncQueries(
     plasmaContract: string
   ): Promise<StateQuery[]>

Description
^^^^^^^^^^^
Returns the `StateQuery`_ objects to execute for a given plasma contract.

Parameters
^^^^^^^^^^
1. ``plasmaContract`` - ``string``: Contract to get sync queries for.

Returns
^^^^^^^
``Promise<StateQuery[]>``: List of queries to execute for a given contract.
.. _`StateQuery`: TODO
.. _`SyncManager`: TODO
