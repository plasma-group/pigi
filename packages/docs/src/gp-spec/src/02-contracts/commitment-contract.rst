###################
Commitment Contract
###################

All implementations **MUST** implement a commitment contract used to store `plasma block roots`_.

******************
Contract Interface
******************

Public Variables
================

blocks
------

.. code-block:: python

   blocks: public(map(uint256, bytes))

Description
^^^^^^^^^^^
Provides a mapping from block number to a published block header.

Events
======

BlockCreated
------------

.. code-block:: python

   BlockCreated: event({
       _number: uint256,
       _header: bytes
   })

Methods
=======

submitBlock
-----------

.. code-block:: python

   @public
   def submitBlock(header: bytes)

Description
^^^^^^^^^^^
Allows a user to submit a new plasma block header. Interestingly, this method can support arbitrarily complex block submission because it can verify that ``msg.sender`` is a smart contract.

Parameters
^^^^^^^^^^
1. ``header`` - ``bytes``: Arbitrary block header to publish.

Requirements
^^^^^^^^^^^^
- **MUST** emit a ``BlockCreated`` event.

