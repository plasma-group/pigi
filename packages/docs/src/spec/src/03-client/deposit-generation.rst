##################
Deposit Generation
##################
Users will usually first interact with a plasma chain by depositing their assets into a `plasma deposit contract`_. Deposits usually consist of a single Ethereum transaction that locks some assets into the depoist contract. This page describes how a client can make a deposit and start using a plasma chain.

`Plasma chain transactions`_ transform the state of a `range`_ of state objects. The state of each range at a moment in time is described by a `state object`_. Each state object specifies the address of a `predicate contract`_ and some additional arbitrary data which are used in tandem to manage ownership of an asset.

Users submit deposit transactions to a `plasma deposit contract`_. Each deposit contract exposes a method ``deposit``:

.. code-block:: solidity

   function deposit(uint256 _amount, StateObject _state) public payable

Where ``StateObject`` is the following struct:

.. code-block:: solidity

   struct StateObject {
       address predicate;
       bytes data;
   }

``deposit`` requires that users specify the ``_amount`` the asset being deposited and an **initial state object**, ``_state``, that controls ownership of the asset. For example, users might use the `SimpleOwnership`_ predicate to control their asset.


.. References

.. _`plasma chain transactions`: ../01-core/state-system.html#transactions
.. _`range`: ../01-core/state-object-ranges.html
.. _`state object`: ../01-core/state-system.html#state-objects
.. _`predicate contract`: ../02-contracts/predicate-contract.html
.. _`plasma deposit contract`: ../02-contracts/deposit-contract.html
.. _`SimpleOwnership`: ../07-predicates/simple-ownership.html
.. _`ABI encoded`: https://solidity.readthedocs.io/en/v0.5.8/abi-spec.html
