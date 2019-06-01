##################
Deposit Generation
##################
Users will usually first interact with a plasma chain by depositing their assets into a `plasma deposit contract`_. Deposits usually consist of a single Ethereum transaction that locks some assets into the depoist contract. This page describes how a client can make a deposit and start using a plasma chain.

******************
Ethereum Addresses
******************
Deposits are transactions to the plasma deposit smart contract. As a result, users must fund an Ethereum account with enough ``ETH`` to pay for the gas of the deposit transaction.

**************************
Deposit Transaction Format
**************************
`Plasma chain transactions`_ transform the state of a `range`_ of coins. The state of each range at a moment in time is described by a `state object`_. Each state object specifies the address of a `predicate contract`_ and some additional arbitrary data which are used in tandem to manage ownership of an asset.

Users submit deposit transactions to a `plasma deposit contract`_. Each deposit contract exposes a method ``deposit``:

.. code-block:: solidity

   function deposit(uint256 _amount, bytes _state) public payable

``deposit`` requires that users specify the ``_amount`` the asset being deposited and an **initial state object**, ``_state``, that controls ownership of the asset. For example, users might use the `SimpleOwnership`_ predicate to control their asset.

State objects have the following structure:

.. code-block:: solidity

   struct StateObject {
       address predicate;
       bytes data;
   }

``_state`` **must** be `ABI encoded`_ as follows:

.. code-block:: typescript

   const predicate = '0x1234.....' // address of the  controlling predicate 
   const data = '0xabc123......' // additional state data given to the predicate
   const state = abi.encode(['address', 'bytes'], [predicate, data])

Once generated, the deposit transaction can simply be sent to the Ethereum network..


.. _`plasma deposit contract`: TODO
.. _`plasma chain transactions`: TODO
.. _`range`: TODO
.. _`state object`: TODO
.. _`predicate contract`: TODO
.. _`SimpleOwnership`: TODO
.. _`ABI encoded`: https://solidity.readthedocs.io/en/v0.5.8/abi-spec.html
