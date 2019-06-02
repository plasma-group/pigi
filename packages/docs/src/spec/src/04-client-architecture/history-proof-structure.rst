#######################
History Proof Structure
#######################

***********
Description
***********
In every plasma block, a `range`_ of state objects can either be deposited, transacted, or not transacted. Whenever clients want to verify a `transaction`_ on a specific range, they need to verify the entire "history" of what happened to the range between the block in which it was first deposited and the block in which the transaction occurred.

For example, let's imagine that a range ``(0, 100)`` was deposited in block 1, not transacted in block 2, and then transacted in block 3. The history proof for a transaction in block 4 would contain the deposit, a proof that the range wasn't transacted in block 2, and a proof that the range was transacted in block 3.

This page will describe the data structure that make up a history proof. We `describe the history proof`_ process in more detail separately.

-------------------------------------------------------------------------------

***************
Data Structures
***************

DepositElement
==============

.. code-block:: typescript
   
   interface DepositElement {
     block: number
     depositId: string
   }

Description
-----------
Proof element for importing `deposits`_.

Fields
------
1. ``block`` - ``number``: Block in which the deposit was included.
2. ``depositId`` - ``string``: `ID`_ of the deposit.

-------------------------------------------------------------------------------


StateUpdateElement
==================

.. code-block:: typescript

   interface StateUpdateElement {
     block: number
     transactions: Transaction[]
     inclusionProof: InclusionProof
   }

Description
-----------
Proof element that transitions an existing state update with some given transactions.

Fields
------
1. ``block`` - ``number``: Block in which the new state update was included.
2. ``transactions`` - ``Transaction[]``: List of `Transaction`_ objects that generated the new state update.
3. ``inclusionProof`` - ``InclusionProof``: An `InclusionProof`_ for the generated state update.

-------------------------------------------------------------------------------


NonInclusionElement
===================

.. code-block:: typescript

   interface NonInclusionElement {
     block: number
     stateUpdate: StateUpdate
     inclusionProof: InclusionProof
   }

Description
-----------
Proof element that shows a given range was **not** spent in a specific block.

Fields
------
1. ``block`` - ``number``: Block in which the state update was included.
2. ``stateUpdate`` - ``StateUpdate``: State update whose implicit range proves that a specific range of state objects were not spent in a specific block.
3. ``inclusionProof`` - ``InclusionProof``: An `InclusionProof`_ that shows the state update was included in the specified block.

-------------------------------------------------------------------------------


HistoryProof
============

.. code-block:: typescript

   type HistoryProof = Array<DepositElement | StateUpdateElement | NonInclusionElement>

Description
-----------
A list of ``DepositElement``, ``StateUpdateElement``, and ``NonInclusionElement`` objects.


.. _`deposits`: TODO
.. _`ID`: TODO
.. _`Transaction`: TODO
.. _`InclusionProof`: TODO
.. _`describe the history proof`: TODO
.. _`transaction`: TODO
.. _`range`: TODO
