##################
History Generation
##################

Clients need to be able to correctly generate `history proofs`_. This page describes the process of querying and generating these proofs.

*************
History Query
*************
Clients can query a history proof by creating a ``HistoryQuery``:

.. code-block:: typescript

   interface HistoryQuery {
     plasmaContract: string
     start: number
     end: number
     startBlock?: number
     endBlock?: number
   }

Where:

1. ``plasmaContract`` - ``string``: Address of the specific plasma contract to query. Clients may `watch several plasma contracts simultaneously`_, so this parameter is required for the client to return the correct history.
2. ``start`` - ``number``: Start of the `range`_ of state objects to query.
3. ``end`` - ``number``: End of the range of state objects to query.
4. ``startBlock`` - ``number``: Block to start querying history from. If not provided, will default to 0.
5. ``endBlock`` - ``number``: Block to query history to. If not provided, will default to the latest block known by the client.

Once created, these queries can be sent to a node via the `history query RPC method`_.

*******************
History Calculation
*******************
When a node receives a history query, they **MUST** follow the following process to generate the correct history proof.

Range Intersection
==================
Generation of a history for a given range begins by performing an intersection of the range with the `historical state`_ for the provided block range. Intersection **MUST** be performed on a start-inclusive, end-exclusive basis. Basically, for each block in the block range, the client needs to find all historical state updates with an `implicit`_ or `explicit`_ range that intersects with the queried range.

Intersection with the historical state will return three types of relevant elements: **Deposit Proof Elements**, **Exclusion Proof Elements**, and **State Update Proof Elements**. Each of these elements are necessary to generate a full history proof. However, each element must be handled differently during the proof generation process. A more detailed explanation of these elements can be found `here`_.

**Deposit Proof Elements** and **State Update Proof Elements** will be found when the `explicit range`_ described by a `state update`_ directly intersects with queried range. 

**Exclusion Proof Elements** are found when the `implicit range`_ described by a `state update`_ intersects with the queried range but the `explicit range`_ **does not**. Exclusion Proof Elements prove that a given range was **not** transacted during a specific block but **do not** prove that the given state update was actually valid.

Proof Generation
================
Deposit Proof Elements, and Exclusion Proof Elements, and State Update Proof Elements must each be handled individually when generating proofs. The process for handling each element is described below.

For each element returned by the range intersection, the client **MUST** generate a corresponding proof element according to the following rules. Proof elements **MUST** be returned in ascending block number order.

Deposit Proof Elements
----------------------
Deposit Proof Elements consist of state updates that are created on the plasma chain when a `deposit`_ is submitted on Ethereum. Because we assume that clients have access to Ethereum, we **SHOULD NOT** include the full state update in the proof. Instead, clients **MUST** include the `deposit ID`_ logged on Ethereum when the deposit was submitted.

Exclusion Proof Elements
------------------------
State updates are all associated with two ranges. A state update's *explicit range* is the range of state objects the update mutates. An update's *implicit range* is the range of objects that the update proves are *not* spent within a given block. This mechanism is a byproduct of our `Merkle Interval Tree`_ construction.

An Exclusion Proof Element consists of a **state update** and an **inclusion proof** . For each Exclusion Proof Element, the client **MUST** provide an `inclusion proof`_ that shows the element was included in a block. An Exclusion Proof Element does **not** prove that the given state update is valid. Therefore, the client **SHOULD NOT** provide any information that proves the validity of the state update beyond the inclusion proof.

State Update Proof Elements
---------------------------
State Update Proof Elements describe the transition of one or more state objects that fall within the specified range. State Update Proof Elements correspond to one or more `transactions`_ that generated the state update.

For each state update, the client **MUST** provide all transactions that produced the state update. However, as these transaction can be used to calculate the state update, the client **SHOULD NOT** provide the state update itself.

The client **MUST** also provide an `inclusion proof`_ for the state update that proves the update was included in the block specified in the state update 

It's possible that the validity of a given transaction may also rely on the existence of some other plasma transaction. When this is the case, the verifier must first verify some additional proof elements before executing a given transaction. For each transaction that corresponds to a state update, the client **MUST** ask for a list of additional proof elements from the predicate plugin of the state objects from which the transaction spends. Any additional proof elements **MUST** be inserted *before* the transaction itself so that the client can verify the necessary state before verifying the transaction.


.. _`history`: TODO
.. _`watch several plasma contracts simultaneously`: TODO
.. _`range`: TODO
.. _`history query RPC method`: TODO
.. _`historical state`: TODO
.. _`state update`: TODO
.. _`implicit range`: TODO
.. _`explicit range`: TODO
.. _`deposit`: TODO
.. _`deposit ID`: TODO
.. _`transactions`: TODO
.. _`inclusion proof`: TODO
.. _`Merkle Interval Tree`: TODO
