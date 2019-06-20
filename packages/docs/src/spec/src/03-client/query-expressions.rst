#################
Query Expressions
#################

***********
Description
***********
We provide a system for filtering `state queries`_ via expressions similar to those used by `mongoDB`_.

-------------------------------------------------------------------------------


***************
Data Structures
***************

Expression
==========

.. code-block:: typescript

   interface Expression {
     [aggregator: string]: Array<string | number | Expression>
   }

Description
-----------
Represents an expression. All expressions consist of an aggregator and a list of input values. Some expressions take other aggregators as input values.

-------------------------------------------------------------------------------


*********
Aggregators
*********

Boolean Aggregators
=================

$and
----

.. code-block:: typescript

   { $and: [ <expression1>, <expression2>, ... ] }

Description
^^^^^^^^^^^
Returns ``true`` if **all** arguments evaluate to ``true``.

Parameters
^^^^^^^^^^
1. ``expressions`` - ``Expression[]``: Any number of ``Expression`` objects.

Returns
^^^^^^^
``boolean``: ``true`` if **all** arguments resolve to ``true``, ``false`` otherwise.

-------------------------------------------------------------------------------


$not
----

.. code-block:: typescript

   { $not: [ <expression> ] }

Description
^^^^^^^^^^^
Returns the boolean opposite of the result of the argument expression.

Parameters
^^^^^^^^^^
1. ``expression``: ``Expression``: A single ``Expression`` object.

Returns
^^^^^^^
``boolean``: ``true`` if the expression resolves to ``false``, ``false`` otherwise.

-------------------------------------------------------------------------------


$or
---

.. code-block:: typescript

   { $or: [ <expression1>, <expression2>, ... ] }

Description
^^^^^^^^^^^
Returns ``true`` if **any** argument evaluates to ``true``.

Parameters
^^^^^^^^^^
1. ``expressions`` - ``Expression[]``: Any number of ``Expression`` objects.

Returns
^^^^^^^
``boolean``: ``true`` if **any** argument resolves to ``true``, ``false`` otherwise.

-------------------------------------------------------------------------------


Comparison Aggregators
====================

$eq
---

.. code-block:: typescript

   { $eq: [ <argument1>, <argument2>, ... ] }

Description
^^^^^^^^^^^
Checks if **all** arguments are equal.

Parameters
^^^^^^^^^^
1. ``arguments`` - ``any[]``: List of input values.

Returns
^^^^^^^
``boolean``: ``true`` if **all** arguments are equal, ``false`` otherwise.

-------------------------------------------------------------------------------


$gt
---

.. code-block:: typescript

   { $gt: [ <argument1>, <argument2> ] }

Description
^^^^^^^^^^^
Checks if the first argument is greater than the second.

Parameters
^^^^^^^^^^
1. ``argument1`` - ``any``: First input value.
2. ``argument2`` - ``any``: Second input value.

Returns
^^^^^^^
``boolean``: ``true`` if the first argument is greater than the second, ``false`` otherwise.

-------------------------------------------------------------------------------


$gte
----

.. code-block:: typescript

   { $gte: [ <argument1>, <argument2> ] }

Description
^^^^^^^^^^^
Checks if the first value is greater than or equal to the second.

Parameters
^^^^^^^^^^
1. ``argument1`` - ``any``: First input value.
2. ``argument2`` - ``any``: Second input value.

Returns
^^^^^^^
``boolean``: ``true`` if the first value is greater than or equal to the second, ``false`` otherwise.

-------------------------------------------------------------------------------


$lt
---

.. code-block:: typescript

   { $lt: [ <argument1>, <argument2> ] }

Description
^^^^^^^^^^^
Checks if the first value is less than the second.

Parameters
^^^^^^^^^^
1. ``argument1`` - ``any``: First input value.
2. ``argument2`` - ``any``: Second input value.

Returns
^^^^^^^
``boolean``: ``true`` if the first value is less than the second, ``false`` otherwise.

-------------------------------------------------------------------------------


$lte
----

.. code-block:: typescript

   { $lte: [ <argument1>, <argument2> ] }

Description
^^^^^^^^^^^
Checks if the first value is less than or equal to the second.

Parameters
^^^^^^^^^^
1. ``argument1`` - ``any``: First input value.
2. ``argument2`` - ``any``: Second input value.

Returns
^^^^^^^
``boolean``: ``true`` if the first value is less than or equal to the second, ``false`` otherwise.

-------------------------------------------------------------------------------


$ne
---

.. code-block:: typescript

   { $ne: [ <argument1>, <argument2>, ... ] }

Description
^^^^^^^^^^^
Returns ``true`` if input values are not all equivalent.

Parameters
^^^^^^^^^^
1. ``arguments`` - ``any[]``: List of input values.

Returns
^^^^^^^
``boolean``: ``true`` if input values are not equivalent, ``false`` otherwise.


.. References

.. _`state queries`: ./state-queries.html
.. _`mongoDB`: https://docs.mongodb.com/manual/reference/aggregator/
