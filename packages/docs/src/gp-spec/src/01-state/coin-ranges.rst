###########
Coin Ranges
###########

**********
Background
**********
Our `generalized state system`_ introduces the idea of `state objects`, which can be used to control the ownership of assets `deposited`_ into the plasma chain. `Plasma Cash`_ describes a version of the generalized state system in which each state object represents an indivisible asset of fixed value. This system significantly reduces the total amount of data each user of the plasma client must store.

Arbitrary value payments become difficult to make within Plasma Cash. This is primarily because coins in Plasma cash may not be split apart or combined. A user may only make payments of a given amount if they are in possession of a set of coins such that the value of these coins is *exactly* the payment amount. Compare this, for example, to the simplicity of making payments in Bitcoin-like systems where a UTXO can be arbitrarily broken apart into outputs with different values.

One method of simplifying payments within such a system is to require that each coin to have an identical small value. Payments of any amount can then be made by sending many coins simultaneously. In order to support simultaneous transfer of coins, we introduce mechanisms that allow users to reference **ranges** of coins within transactions.

************
Transactions
************
The `transaction format`_ described in our `generalized state system`_ specifies that a transaction **MUST** provide a reference to the `state object`, or set of state objects, from which it spends. Conveniently, this allows us to create transactions over **ranges** of state objects.

The specification for a transaction over a range is very simple. Remember that each ``objectId`` in our system is a `unique 32 byte identifier`_. We therefore require that the ``objectIds`` field be a 64 byte value. The first 32 bytes of this value represents the start of the transacted range and the last 32 bytes represents the end of the transacted range. Transactions over ranges are, in effect, transactions on each individual state object where ``object.id`` falls within the specified range.

Rationale
=========
As described in the `Background`_ section above, we need to be able to efficiently transact many state objects simultaneously. By allowing transactions to refer to a set of state objects with a range, it's no longer necessary to submit a transaction for each individual state object.

Requirements
============
- The ``objectIds`` field of every transaction:
   - **MUST** be a 64 byte value.
   - **MUST** begin with a 32 byte value that represents that start of the transacted range.
   - **MUST** end with a 32 byte value that represents the end of the transacted range.

.. _`deposited`: TODO
.. _`Plasma Cash`: TODO
.. _`generalized state system`: TODO
.. _`transaction format`: TODO
.. _`unique 32 byte identifier`: TODO

