##############
HistoryManager
##############

***********
Description
***********
``HistoryManager`` is a wrapper around `HistoryDB`_ that provides easy access to specific historical data. ``HistoryManager`` handles things like generating `history proofs`_, creating `inclusion proofs`_, and inserting historical `state updates`_. 

We've separated ``HistoryManager`` from ``HistoryDB`` to avoid coupling the underlying data storage with more complex queries.

***
API
***

Methods
=======

getHistoryProof
---------------

.. code-block:: typescript

   async function getHistoryProof(
     start: number,
     end: number,
     startBlock: number,
     endBlock: number,
     plasmaContract: string
   ): Promise<HistoryProof>

Description
^^^^^^^^^^^
Generates a proof for the `history`_ of a given range of `state objects`_. Only returns the history for a specified block range so that a user with a known state doesn't need to receive a significant amount of duplicate information.

Parameters
^^^^^^^^^^
1. ``start`` - ``number``: Start of the range of state objects to query.
2. ``end`` - ``number``: End of the range of state objects to query.
3. ``startBlock`` - ``number``: Block number to start querying history from.
4. ``endBlock`` - ``number``: Block number to query history to.
5. ``plasmaContract`` - ``string``: Address of the specific plasma contract to query.

Returns
^^^^^^^
``HistoryProof``: A `HistoryProof`_ composed of `proof elements`_ that, when applied sequentially, build a `valid history`_ for the given range.

getInclusionProof
-----------------

.. code-block:: typescript

   function getInclusionProof(
     stateUpdate: StateUpdate
   ): Promise<InclusionProof>

Description
^^^^^^^^^^^
Generates an `inclusion proof`_ for a given state update. Creates a proof for both the upper-level `address tree`_ and the lower-level `state tree`_. Will throw an error if the client does not have enough information to generate the proof.

Parameters
^^^^^^^^^^
1. ``stateUpdate`` - ``StateUpdate``: The ``StateUpdate`` object to generate an inclusion proof for.

Returns
^^^^^^^
``InclusionProof``: An ``InclusionProof`` that contains `Merkle Interval Tree`_ inclusion proofs for both the address tree and the state tree.

.. _`HistoryDB`: TODO
.. _`history proofs`: TODO
.. _`Merkle Interval Tree`: TODO
.. _`state tree`: TODO
.. _`address tree`: TODO
.. _`inclusion proof`:
.. _`inclusion proofs`: TODO
.. _`valid history`: TODO
.. _`proof elements`: TODO
.. _`HistoryProof`: TODO
.. _`state objects`: TODO
.. _`history`: TODO

