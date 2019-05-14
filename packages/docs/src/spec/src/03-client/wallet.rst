######
Wallet
######

***********
Description
***********
Clients often need to create signatures in order to authenticate transactions. The ``Wallet`` component provides a standard interface for creating new accounts, querying existing accounts, and signing arbitrar data.

***
API
***

Methods
=======

getAccounts
-----------

.. code-block:: typescript

   async function getAccounts(): Promise<string[]>

Description
^^^^^^^^^^^
Queries the addresses of all accounts stored in the wallet.

Returns
^^^^^^^
``Promise<string[]>``: List of all account addresses in the wallet.

createAccount
-------------
.. code-block:: typescript

   async function createAccount(password: string): Promise<string>

Description
^^^^^^^^^^^
Creates an account and returns the new account's address. Encrypts the account with a given password.

Parameters
^^^^^^^^^^
1. ``password`` - ``string``: Password used to encrypt the account.

Returns
^^^^^^^
``string``: Address of the newly created account.

