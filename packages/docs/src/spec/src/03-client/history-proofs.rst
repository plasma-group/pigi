##############
History Proofs
##############

************
Introduction
************

In every plasma block, a `range`_ of `state objects`_ can either be deposited, transacted, or not transacted. Whenever clients want to verify a `transaction`_ on a specific range, they need to verify the entire "history" of what happened to the range between the block in which it was first deposited and the block in which the transaction occurred.

For example, let’s imagine that a range ``(0, 100)`` was deposited in block 1, not transacted in block 2, and then transacted in block 3. The history proof for a transaction in block 4 would contain the deposit, a proof that the range wasn't transacted in block 2, and a proof that the range was transacted in block 3.

This page describes the basic components of the history proof. Details about `generating a history proof`_ and `verifying a history proof`_ are described later.

**************
Proof Elements
**************
History proofs consist of a series of "proof elements", which correspond to some action that took place within a specific plasma block. A proof element can be a **Deposit Proof Element**, **Exclusion Proof Element**, or a **State Update Proof Element**. Each element type conveys different information and needs to be handled differently.

Deposit Proof Elements
======================
Deposit Proof Elements consist of a `deposit ID`_. Deposit IDs correspond to a `deposit on Ethereum`_. Deposits on Ethereum contain a state update, which a client can query and insert into their local state.

Exclusion Proof Elements
========================
Exclusion Proof Elements consist of a single `state update`_ and an inclusion proof for that state update. They prove that a specific range was **not** transacted during a given block, but they **do not** prove that the given state update is valid.

These proof elements take advantage of the fact that items of our `Merkle Interval Tree`_ have both an `explicit range`_ and an `implicit range`_. A valid inclusion proof for an item in the tree also proves that there aren't any valid items that intersect with that element's implicit range. A user can check the inclusion proof for the state update in the Exclusion Proof Element and be sure that its implicit range wasn't transacted in the given block.

State Update Proof Elements
===========================
State Update Proof Elements prove that a given `state update`_ was correctly created from the previous state update. Despite the name, State Update Proof Elements actually include **transactions** and not state updates. The provided transactions are used to compute the newer state update. These elements also include a **block number** in which the computed state update was included and an **inclusion proof** that the update was actually included.


.. References

.. _`state objects`: ../01-core/state-system.html#state-objects
.. _`state update`: ../01-core/state-system.html#state-updates
.. _`transaction`: ../01-core/state-system.html#transactions
.. _`Merkle Interval Tree`: ../01-core/merkle-interval-tree.html
.. _`range`: ../01-core/state-object-ranges.html
.. _`deposit on Ethereum`: ./deposit-generation.html
.. _`generating a history proof`: ./history-generation.html
.. _`verifying a history proof`: ./history-verification.html
.. _`deposit ID`: TODO
.. _`explicit range`: TODO
.. _`implicit range`: TODO
