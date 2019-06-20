###############
Synchronization
###############

************
Introduction
************
Clients need to be able to synchronize their local state with that of the aggregator. However, this process is somewhat non-trivial as clients may be simultaneously connected to multiple plasma chains.

The actual process for synchronizing a client can generally be determined by the client implementer. However, we're going to go through some recommendations that will ensure that the client is as feature-complete as possible.

********************************
Deposit and Commitment Contracts
********************************
Our plasma construction makes use of `deposit contracts`_ that store the assets that users transact on the plasma chain. These deposit contracts act like their own individual plasma chains. For example, the `range`_ ``(0, 100)`` will be valid on two different deposit contracts but will refer to different assets.

Furthermore, we're generally using a single deposit contract per asset type to simplify things for the client. It's therefore very likely that a client will be interested in transactions on several different deposit contracts. As a result, clients **SHOULD** be able to send and receive transactions on multiple deposit contracts simultanously.

We're also using the new concept of `commitment contracts`_ that store plasma block commitments instead of throwing all of this logic inside the deposit contract. Each deposit contract points to a specific commitment contract, and it's possible for multiple deposit contracts to point to the same contract. Therefore a client **SHOULD** also be able to watch for commitments to multiple commitment contracts and **SHOULD** maintain a mapping between commitment contracts and deposit contracts.

**********************
Receiving Transactions
**********************
Transactions are unique to a given deposit contract, but blocks are unique to a commitment contract. For each commitment contract the client is interested in, clients **SHOULD** watch for new blocks being published to Ethereum.

It's important to note that, unlike in previous plasma constructions, there's no easy way for an aggregator to tell that a given address will be interested in a specific transaction. Instead, clients **SHOULD**, upon seeing the publication of a new block, send a `state query`_ to the aggregator for all state updates the client is interested in.

For example, imagine we have a predicate that allows anyone to mutate a state object as long as they have the pre-image to some hash. Without the pre-image, the aggregator has no way to know which user "owns" that state object. A client would have to specifically form a query for all state objects that use that predicate and lock the state object with a specific hash.


.. References

.. _`range`: ../01-core/state-object-ranges.html
.. _`deposit contracts`: ../02-contracts/deposit-contract.html
.. _`commitment contracts`: ../02-contracts/commitment-contract.html
.. _`exits`: TODO
