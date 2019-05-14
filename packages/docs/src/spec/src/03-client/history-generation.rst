##################
History Generation
##################

*************
History Query
*************

Data Structures
===============

HistoryQuery
------------

.. code-block:: typescript

   interface HistoryQuery {
     plasmaContract: string
     start: number
     end: number
     startBlock?: number
     endBlock?: number

Description
^^^^^^^^^^^
Formatted query that can be sent to a client to return the `history`_ for a given range of state objects.

Fields
^^^^^^
1. ``plasmaContract`` - ``string``: Address of the specific plasma contract to query. Clients may `watch several plasma contracts simultaneously`_, so this parameter is required for the client to return the correct history.
2. ``start`` - ``number``: Start of the `range`_ of state objects to query.
3. ``end`` - ``number``: End of the range of state objects to query.
4. ``startBlock`` - ``number``: Block to start querying history from. If not provided, will default to block 0.
5. ``endBlock`` - ``number``: Block to query history to. If not provided, will default to the latest block known by the client.

Sending History Queries
=======================
Queries can be sent to the client via the `history query RPC method`_.

*******************
History Calculation
*******************

Range Intersection
==================
Generation of a history for a given range begins by performing an intersection of the range with the `historical state`_ for the provided block range. Interesection **MUST** be performed on a start-inclusive, end-exclusive basis.

Intersection with the historical state will return three types of relevant elements, *deposit elements*, *state update elements*, and *non-inclusion elements*. Each of these elements are necessary to generate a full history proof. However, each element must be handled differently during the proof generation process.

**Deposit elements** and **state update elements** are found when the `range`_ described by a `state update`_ directly intersects with queries range.

**Non-inclusion elements** are found when the `implicit range`_ described by a `state update`_ intersects with the queried range but the `explicit range`_ does not. Non-inclusion elements prove that a given range was **not** transacted during a specific block.

Proof Generation
================
Deposits, transactions, and non-inclusion elements must each be handled individually when generating proofs. The process for handling each element is described below.

For each element returned by the range intersection, the client **MUST** generate a corresponding proof element according to the following rules. Proof elements **MUST** be returned in ascending block number order.

Deposit Elements
----------------
Deposit elements are state updates that are created on the plasma chain when a `deposit`_ is submitted on Ethereum. Because we assume that clients have access to Ethereum, we **SHOULD NOT** include the full state update in the proof. Instead, clients **MUST** include the `deposit ID`_ logged on Ethereum when the deposit was submitted.

State Update Elements
---------------------
State update elements describe the transition of one or more state objects that fall within the specified range. State update elements correspond to one or more `transactions`_ that generated the state update.

For each state update, the client **MUST** provide all transactions that produced the state update. However, because these transaction can be used to calculate the state update, the client **SHOULD NOT** provide the state update itself.

The client **MUST** also provide an `inclusion proof`_ for the state update that proves the update was included a block. 

It's possible that the validity of a given transaction may also rely on the existence of some other plasma transaction. When this is the case, the verifier must first verify some additional proof elements before executing a given transaction. For each transaction that corresponds to a state update, the client **MUST** ask for a list of additional proof elements from the prediate plugin of the state objects from which the transaction spends. Any additional proof elements **MUST** be inserted *before* the transaction itself so that the client can verify the necessary state before verifying the transaction.

Non-Inclusion Elements
----------------------
State updates are all associated with two ranges. A state update's *explicit range* is the range of state objects the update mutates. An update's *implicit range* is the range of objects that the update proves are *not* spent within a given block. This mechanism is a byproduct of our `Merkle Interval Tree`_ construction.

Non-inclusion elements are **state updates** . For each non-inclusion element, the client **MUST** provide an `inclusion proof`_ that shows the element was included in a block. `The validity of a non-inclusion proof is not impacted by the validity of the state update`_. Therefore, the client **SHOULD NOT** provide any information that proves the validity of the state update beyond the inclusion proof.


