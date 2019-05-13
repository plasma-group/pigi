###################
Commitment Contract
###################

***
API
***

Public Variables
================

blocks
------

.. code-block:: python

   blocks: public(map(uint256, bytes))

Description
^^^^^^^^^^^

Rationale
^^^^^^^^^

Events
======

BlockSubmitted
--------------

.. code-block:: python

   BlockSubmitted: event({
       _number: uint256,
       _header: bytes
   })

Description
^^^^^^^^^^^

Parameters
^^^^^^^^^^

Rationale
^^^^^^^^^

Methods
=======

submitBlock
-----------

.. code-block:: python

   @public
   def submitBlock(header: bytes):

Description
^^^^^^^^^^^

Parameters
^^^^^^^^^^

Returns
^^^^^^^

Rationale
^^^^^^^^^

Requirements
^^^^^^^^^^^^

