                ####################
History Verification
####################

Once a client has received a `history proof`_, they need to be able to correctly check the proof's validity. This page describes the process for applying each individual proof element and determining the overal validity of the proof.

***************
Proof Structure
***************
A `HistoryProof`_ consists of a series of "proof elements". Each of these elements is either a **Deposit Proof Element**, an **Exclusion Proof Element**, or a **State Update Proof Element**. Elements of each different element type must be handled differently as they convey different information.

***********************
Applying Proof Elements
***********************
Proof elements each correspond to some action that took place within a specific plasma block. Proof elements **MUST** be applied in ascending block order. Otherwise, a client may not have the necessary information to verify a specific state transition.

Deposit Proof Elements
=======================
Deposit Proof Elements consist of a **deposit ID**. Deposit IDs correspond to a `deposit on Ethereum`_, which contains a `state update`_. Whenever the client encounters a Deposit Proof Element, the client **MUST** download the deposit with the given ID by querying for the `checkpoint`_ with the same ID.

For efficiency, the client **SHOULD** check their local database for the deposit before querying Ethereum. It's possible that the client already downloaded while verifying another history proof.

If the deposit is not found, the client **MUST** either throw an error or skip the element.

Once the client has downloaded the corresponding deposit, the client **MUST** insert the deposit's state update into their local state. The client does **not** need to verify anything about this state update since it came directly from a deposit.

Exclusion Proof Elements
========================
Elements of our `Merkle Interval Tree`_ have both an `explicit range`_ and an `implicit range`_. A valid inclusion proof for an element of the tree also conveys the fact that no other elements intersect with the included element's implicit range.

Exclusion Proof Elements simply consist of a `state update`_ and an `inclusion proof`_. These elements make no statements about the validity of the state update, but prove that there were no valid transactions on the update's implicit range. 

The client **MUST** verify the inclusion proof for each Exclusion Proof Element. If the inclusion proof fails, the client **MUST** either throw an error or skip to the next proof element.

The client **MUST** then find all state updates that intersect with the implicit range of the proof element where ``update.verifiedBlockNumber`` is equal to ``element.block - 1``. We're only interested in these state updates because the implicit proof only applies to the ``element.block`` but not any previous blocks.

Next, for each found state update, the client **MUST** split any elements where the implicit range only partially covers the intersected update. For example, if the implicit range is ``(50, 100)`` but the found update is over ``(0, 100)``, the client will split the update into two elements that cover ``(0, 50)`` and ``(50, 100)``. This process will leave the client with a set of state updates that are entirely covered by the implicit range and a set that no longer intersect at all.

Next, for each element that is **entirely** covered by the implicit range, the client **MUST** set ``update.verifiedBlockNumber`` to ``element.block``. This process effectively finds any state updates covered by the implicit range and "bumps up" the block to which they're considered valid.

State Update Proof Elements
===========================
State Update Proof Elements prove that a given `state update`_ has transitioned to a newer one. Despite the name, State Update Proof Elements actually consist of `transactions`_ and not state updates. The provided transactions are used to compute the newer state update. These elements also include a block number in which the computed state update was included and an `inclusion proof`_ that the state update was actually included in the given block.

For simplicity, we require that all of the transactions within a single State Update Proof Element refer to the same range. If any of the transactions do not refer to the same range, the client **MUST** either throw an error or skip to the next element.

Next, the client **MUST** find all previously verified state updates that intersect with the range on the transations **and** where ``update.verifiedBlockNumber`` is equal to ``element.block - 1``.

For each update found in the previous step, the client then **MUST** `execute each transaction`_ against the update. Each transaction execution will generate a resulting state update.

After executing the transactions against all updates, the client **MUST** verify that the resulting state updates are all equivalent. If any state update is not equivalent, the client **MUST** either throw an error or skip to the next proof element. The resulting update **MUST** have a block number equal to ``element.block``.

The client then **MUST** verify the inclusion proof provided as part of the proof element. If the inclusion proof is invalid, the client **MUST** either throw an error or skip to the next proof element.

Finally, the client **MUST** insert the resulting state update into the local state. This process **MUST** split or overwrite any existing state updates over the same range. For example, if the local state contains an update that covers ``(0, 100)`` and the computed update covers ``(50, 100)``, the client will modify the first update such that it only covers ``(0, 50)``.



.. _`HistoryProof`: TODO
.. _`deposit on Ethereum`: TODO
.. _`state update`: TODO
.. _`Merkle Interval Tree`: TODO
.. _`explicit range`: TODO
.. _`implicit range`: TODO
.. _`inclusion proof`: TODO
.. _`transactions`: TODO
.. _`execute each transaction`: TODO
.. _`checkpoint`: TODO
