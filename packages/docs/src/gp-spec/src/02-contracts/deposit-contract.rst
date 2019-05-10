################
Deposit Contract
################

All implementations **MUST** provide a standard deposit contract that allows a user to deposit assets "into" the plasma chain by locking the assets on Ethereum.

******************
Contract Interface
******************

Structs
=======

Deposit
-------

.. code-block:: python

   struct Deposit:
       asset: uint256
       state: bytes

Description
^^^^^^^^^^^
Represents an asset deposit into the plasma chain.

Fields
^^^^^^
1. ``asset`` - ``uint256``: ID of the deposited asset type.
2. ``state`` - ``bytes``: RLP encoded `StateObject`_ used to initally lock the deposited assets.

Public Variables
================

deposits
--------

.. code-block:: python

   deposits: public(map(bytes, Deposit))

Description
^^^^^^^^^^^
Provides a mapping from deposit identifiers to ``Deposit`` objects.

Events
======

DepositCreated
--------------

.. code-block:: python

   DepositCreated: event({
       _asset: indexed(uint256),
       _id: bytes,
       _state: bytes
   })

Description
^^^^^^^^^^^
Emitted when a new deposit has been created.

Fields
^^^^^^
1. ``_asset`` - ``indexed(uint256)``: ID of the deposited asset type.
2. ``_id`` - ``bytes``: Identifier for the deposit.
3. ``_state`` - ``bytes``: RLP encoded `StateObject`_ used to initially lock the deposited assets.

Methods
=======


deposit
-------

.. code-block:: python

   @public
   @payable
   def deposit(asset: uint256, amount: uint256, state: bytes)

Description
^^^^^^^^^^^
Allows a user to submit a deposit for the asset represented by the deposit contract.

Parameters
^^^^^^^^^^
1. ``asset`` - ``uint256``: Unique identifier for the asset being deposited.
2. ``amount`` - ``uint256``: Amount of the asset being deposited.
3. ``state`` - ``bytes``: RLP encoded `StateObject`_ that will lock the deposited asset.

Requirements
^^^^^^^^^^^^
- **MUST** throw an error if the amount deposited is not equal to the ``amount`` specified.
- **MUST** emit a ``DepositCreated`` event.


.. _`StateObject`: TODO

