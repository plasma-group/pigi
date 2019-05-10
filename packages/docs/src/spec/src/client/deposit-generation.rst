==================
Deposit Generation
==================

Users can transfer assets from Ethereum to the plasma chain by **depositing** these assets into a `plasma deposit contract`_ on Ethereum. Once an asset has been deposited, it's effectively locked inside of the contract until someone attempts to `withdraw`_ it. We'll now go through the exact flow for a user who wants to deposit an asset into the plasma chain.

Ethereum Addresses
==================

Deposits are transactions to the plasma deposit smart contract. As a result, users must fund an Ethereum account with enough ``ETH`` to pay for the gas of the deposit transaction.

Deposit Transaction Format
==========================

Standard `plasma chain transactions`_ are inputs to functions that transform state of a `range`_ of coins. The state of each range at a moment in time is described by a `state object`_. Each state object specifies the address of a `predicate contract`_ and some additional arbitrary data which are used in tandem to manage ownership of an asset.

For simplicity and consistency, we treat deposits as a special case of these standard plasma chain transaction. Deposits **must** specify a **state object** which represents the state of the deposited assets immediately upon deposit. We imagine that this state object will often simply give ownership of the asset to the depositing user. 

Users submit deposit transactions to a `plasma deposit contract`_. Deposit contracts are defined on a **per-asset basis** to reduce overall complexity. Each deposit contract exposes a method ``deposit`` users call when submitting a deposit. The signature of ``deposit`` is:

```python=
@public
@payable
def deposit(amount: uint256, state: bytes):
```

Users must specify the ``amount`` the asset being deposited. Deposit contracts for non-fungible assets will likely require that this value equals ``1``. 

Users must also specify an **initial state object**, ``state``, that controls ownership of the asset. For example, users might use the `SimpleOwnership`_ predicate to control their asset and specify their own address as the ``owner`` input to the predicate. State objects have the following structure:

.. code-block:: python
   
   struct StateObject:
        predicate: address
        data: bytes

``state`` **must** be `ABI encoded`_ as follows:

.. code-block:: typescript
   
   const predicate = '0x1234.....' // address of the  controlling predicate 
   const data = '0xabc123......' // additional state data given to the predicate
   const state = abi.encode(['address', 'bytes'], [predicate, data])

Deposit Submission
==================

Deposits are sent as standard Ethereum transactions to the plasma deposit contract. Clients can use libraries like `web3`_ or `ethers`_ to create these transactions.

.. _`plasma deposit contract`: TODO
.. _`withdraw`: TODO
.. _`plasma chain transactions`: TODO
.. _`range`: TODO
.. _`state object`: TODO
.. _`predicate contract`: TODO
.. _`SimpleOwnership`: TODO
.. _`ABI encoded`: https://solidity.readthedocs.io/en/v0.5.8/abi-spec.html
.. _`web3`: https://github.com/ethereum/web3.js/
.. _`ethers`: https://github.com/ethers-io/ethers.js/

