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
   @payable
   def submitBlock(header: bytes, witness: bytes)

Description
^^^^^^^^^^^
Allows a user to submit a new plasma block header.

Parameters
^^^^^^^^^^
1. ``header`` - ``bytes``: Arbitrary block header to publish.
2. ``witness`` - ``bytes``: Additional witness data that may be used to check whether the given block header is authorized.

Requirements
^^^^^^^^^^^^
- **MUST** emit a ``BlockCreated`` event.
