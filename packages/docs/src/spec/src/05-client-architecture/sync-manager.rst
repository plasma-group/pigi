###########
SyncManager
###########

***********
Description
***********
``SyncManager`` runs in the background and automatically synchronizes the client's state with the aggregator's state. It watches for new block submissions and queries the aggregator for any relevant state updates.

-------------------------------------------------------------------------------

***
API
***

Methods
=======

addDepositContract
------------------

.. code-block:: typescript

   async function addDepositContract(
     commitmentContract: string,
     depositContract: string
   ): Promise<void>

Description
^^^^^^^^^^^
Connects a deposit contract to a commitment contract.

Parameters
^^^^^^^^^^
1. ``commitmentContract`` - ``string``: Address of the commitment contract to connect to.
2. ``depositContract`` - ``string``: Address of the deposit contract to connect.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the contracts have been connected.

removeDepositContract
---------------------

.. code-block:: typescript

   async function removeDepositContract(
     commitmentContract: string,
     depositContract: string
   ): Promise<void>

Description
^^^^^^^^^^^
Removes a connection between a deposit contract and a commitment contract.

Parameters
^^^^^^^^^^
1. ``commitmentContract`` - ``string``: Commitment contract to remove the connection from.
2. ``depositContract`` - ``string``: Deposit contract to remove.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the contracts have been disconnected.

getLastSyncedBlock
------------------

.. code-block:: typescript

   async function getLastSyncedBlock(plasmaContract: string): Promise<number>

Description
^^^^^^^^^^^
Gets the last block up to which the manager has synchronized for a given plasma chain.

Parameters
^^^^^^^^^^
1. ``plasmaContract`` - ``string``: ID of the plasma chain to get the last synced block for.

Returns
^^^^^^^
``Promise<number>``: Block up to which the manager has synchronized.

addSyncQuery
------------

.. code-block:: typescript

   async function addSyncQuery(
     plasmaContract: string,
     stateQuery: StateQuery
   ): Promise<void>

Description
^^^^^^^^^^^
Adds a `StateQuery`_ to the list of queries to call on a specific plasma chain when the synchronization loop triggers. Necessary because different predicates can be parsed in different ways and the manager needs to know what to look for.

Parameters
^^^^^^^^^^
1. ``plasmaContract`` - ``string``: ID of the plasma contract to add a query for.
2. ``stateQuery`` - ``StateQuery``: `StateQuery`_ to add for that contract.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the query has been added.

removeSyncQuery
---------------

.. code-block:: typescript

   async function removeSyncQuery(
     plasmaContract: string,
     stateQuery: StateQuery,
   ): Promise<void>

Description
^^^^^^^^^^^
Removes a `StateQuery`_ to the list of queries to call on a specific plasma chain when the synchronization loop triggers.

Parameters
^^^^^^^^^^
1. ``plasmaContract`` - ``string``: ID of the plasma contract to remove a query for.
2. ``stateQuery`` - ``StateQuery``: `StateQuery`_ to remove for that contract.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the query has been added.

.. _`StateQuery`: TODO

getSyncQueries
--------------

.. code-block:: typescript

   async function getSyncQueries(plasmaContract: string): Promise<StateQuery[]>

Description
^^^^^^^^^^^
Returns the list of active `StateQuery`_ objects the manager is using when the synchronization loop triggers.

Parameters
^^^^^^^^^^
1. ``plasmaContract`` - ``string``: Contract to get active queries for.

Returns
^^^^^^^
``Promise<StateQuery[]>``: A list of `StateQuery`_ objects the manager is using.


.. References

.. _`StateQuery`: ../03-client/state-manager.html#statequery
