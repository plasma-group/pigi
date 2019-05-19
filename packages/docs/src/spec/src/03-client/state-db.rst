#######
StateDB
#######

***********
Description
***********
``StateDB`` handles storage and modification of the local verified state. ``StateDB`` is frequently used by `StateManager`_ to keep track of the known state and to verify incoming transactions.

-------------------------------------------------------------------------------


***************
Data Structures
***************

VerifiedStateUpdate
===================

.. code-block:: typescript

   interface VerifiedStateUpdate {
     start: number
     end: number
     verifiedBlockNumber: number
     stateUpdate: StateUpdate
   }

Description
-----------
Represents a `StateUpdate`_ that has been `correctly verified`_ up to a specific block. ``verifiedBlockNumber`` is updated whenever a `non-inclusion proof`_ implicitly demonstrates that the given state update is valid for ``verifiedBlockNumber + 1``.

Fields
------
1. ``start`` - ``number``: Start of the range for which this state update is still valid.
2. ``end`` - ``number``: End of the range for which this state update is still valid.
3. ``verifiedBlockNumber`` - ``number``: Plasma block number up to which this state update has been verified.
4. ``stateUpdate`` - ``StateUpdate``: Full original state update.

-------------------------------------------------------------------------------


***
API
***

Methods
=======

getVerifiedStateUpdates
-----------------------

.. code-block:: typescript

   async function getVerifiedStateUpdates(start: number, end: number): Promise<VerifiedStateUpdate[]>

Description
^^^^^^^^^^^
Pulls all ``VerifiedStateUpdate`` objects such that the range described by ``start`` and ``end`` intersects with the ``VerifiedStateUpdate``. Intersection **must** be computed as start-inclusive and end-exclusive, i.e. ``(start, end]``.

Parameters
^^^^^^^^^^
1. ``start`` - ``number``: Start of the range to query.
2. ``end`` - ``number``: End of the range to query.

Returns
^^^^^^^
``Promise<VerifiedStateUpdate[]>``: List of ``VerifiedStateUpdate`` objects that intersect with the given range.

-------------------------------------------------------------------------------


putVerifiedStateUpdate
----------------------

.. code-block:: typescript

   async function putVerifiedStateUpdate(
     verifiedStateUpdate: VerifiedStateUpdate
   ): Promise<void>

Description
^^^^^^^^^^^
Adds a new ``VerifiedStateUpdate`` object to the database. Overwrites, modifies, or breaks apart any existing objects in the database that intersect with the given one.

Parameters
^^^^^^^^^^
1. ``verifiedStateUpdate`` - ``VerifiedStateUpdate``: The ``VerifiedStateUpdate`` object to insert into the database.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the object has been added to the database.


.. _`StateManager`: TODO
.. _`StateUpdate`: TODO
.. _`correctly verified`: TODO
.. _`non-inclusion proof`: TODO

