##################
RPC Error Messages
##################

******
Wallet
******

Account Not Found
=================

.. code-block:: json

   {
     code: -20001,
     message: "Account Not Found",
     data: <address>
   }

Description
-----------
Error returned when an account has not been found for a given address.

Code
----
-20001

Data
----
1. ``address`` - ``string``: Address of the queried account.

-------------------------------------------------------------------------------

Invalid Password
================

.. code-block:: json

   {
     code: -20002,
     message: "Invalid Password",
     data: <address>
   }

Description
-----------
Returned when the user attempts to unlock an account with an invalid password.

Code
----
-20002

Data
----
1. ``address`` - ``string``: Address of the account the user attempted to unlock.

-------------------------------------------------------------------------------

Account Locked
==============

.. code-block:: json

   {
     code: -20003,
     message: "Account Locked",
     data: <address>
   }

Description
-----------
Returned when a user attempts to sign some data with a locked account.

Code
----
-20003

Data
----
1. ``address`` - ``string``: Address of the account the user attempted to sign with.

-------------------------------------------------------------------------------

************
Transactions
************

Invalid Transaction Encoding
============================

.. code-block:: json

   {
     code: -20004,
     message: "Invalid Transaction Encoding"
   }

Description
-----------
Returned when a user attempts to submit an `incorrectly encoded transaction`_.

Code
----
-20004

-------------------------------------------------------------------------------

Invalid Transaction
===================

.. code-block:: json

   {
     code: -20005,
     message: "Invalid Transaction"
   }

Description
-----------
Returned when a user submits a transaction that `executes incorrectly`_.

Code
----
-20005

-------------------------------------------------------------------------------

*************
State Queries
*************

Invalid State Query
===================

.. code-block:: json

   {
     code: -20006,
     message: "Invalid State Query"
   }

Description
-----------
Returned when the user attempts to make an invalid `state query`_.

Code
----
-20006


.. References

.. _`state query`: ./state-queries.html
.. _`incorrectly encoded transaction`: ../01-core/state-system.html#id12
.. _`executes incorrectly`: TODO
