########################
Double Layer Merkle Tree
########################

**********
Background
**********
The amount of data a user needs to store in a `Plasma Cash`_ chain is linearly proportional to the number of `state objects`_ that user "owns" within the chain. `Plasma Cashflow`_, however, relies on the concept of `ranges`_ of state objects in order to add a sense of fungibility to Plasma Cash. Users of a Plasma Cashflow chain instead store an amount of data linearly proportional to the number of **ranges** they own, not the number of individual state objects within those ranges.

The fewer ranges a user needs to track, the less data they need to store. It's for this reason that we need some sort of mechanism for `defragmenting`_ ranges. A detailed explanation of the defragmentation process is described `outside of this page`_.

The basic idea behind defragmentation is that contiguous ranges can be "merged" into a single larger range. Users can execute atomic swaps with others users in order to trade disconnected ranges for contiguous ones. This process is relatively straightforward when the assets underlying the ranges are identical -- trading 1 ETH for 1 ETH carries no risk. However, the process is significantly more complex if the underlying assets are different. 

We can ensure that the underlying asset will always be the same by reserving some space for the asset. One way to accomplish this is to modify the `ID of a state object`_ with a unique prefix for each asset. For example, the range of state object IDs for ETH might be prefixed with a zero (``(0)(0 - 2^256)``) while the range of IDs for `WETH`_ might be prefixed with a one (``(1)(0 - 2^256)``). This scheme makes sure that the ranges next to yours will always have the same underlying asset.

Another way to achieve the same result is simply to have a different Plasma Cashflow chain for each asset. We do so by creating a unique `deposit contract`_ for each asset. The prefix" for a range becomes the address of the deposit contract that corresponds to the asset.

However, this means that we're simultaneously running a lot of plasma chains. We don't want to have to submit a `block root`_ for each individual chain. We get around this by creating a **double-layered** `Merkle Interval Tree`_. This page explains how the double-layered tree is computed.

**********
State Tree
**********

.. todo::

   Explain the purpose and structure of the state tree.

************
Address Tree
************

.. todo::

   Explain the purpose and structure of the address tree.

************
Tree Diagram
************
We've provided a diagram of the double-layer Merkle Interval Tree below. The diagram explains the relationship the state updates that form the tree and the tree itself.

.. raw:: html

   <img src="../../_static/images/double-layer-tree/double-layer-tree.svg" alt="Double-Layer Merkle Interval Tree">


.. References

.. _`ranges`: ./state-object-ranges.html
.. _`state objects`: ./state-system.html#state-objects
.. _`ID of a state object`: ./state-system.html#state-objects
.. _`Merkle Interval Tree`: ./merkle-interval-tree.html
.. _`deposit contract`: ../02-contracts/deposit-contract.html
.. _`Plasma Cashflow`: https://hackmd.io/DgzmJIRjSzCYvl4lUjZXNQ?view#
.. _`Plasma Cash`: https://www.learnplasma.org/en/learn/cash.html
.. _`WETH`: https://weth.io/
.. _`defragmenting`: TODO
.. _`outside of this page`: TODO
.. _`block root`: TODO
