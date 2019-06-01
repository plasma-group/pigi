########
WalletDB
########

***********
Description
***********
``WalletDB`` stores and manages access to `standard keystore`_ files. We require that keystore files **MUST** be encrypted for the safety of user funds.

-------------------------------------------------------------------------------

***
API
***

Structs
=======

Keystore
--------

.. code-block:: typescript

   interface Keystore {
     address: string
     crypto: {
       cipher: string
       ciphertext: string
       cipherparams: {
         iv: string
       }
       kdf: string
       kdfparams: {
         dklen: number
         n: number
         p: number
         r: number
         salt: string
       }
       mac: string
     }
     id: string
     version: number
   }

Description
^^^^^^^^^^^
Standard format for storing `keystore objects`_ in Ethereum.


-------------------------------------------------------------------------------

Methods
=======

putKeystore
-----------

.. code-block:: typescript

   async function setKeystore(address: string): Promise<void>

Description
^^^^^^^^^^^
Sets the keystore file for a given address.

Parameters
^^^^^^^^^^
1. ``address`` - ``string``: Address to set a keystore for.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the keystore has been inserted.


-------------------------------------------------------------------------------

getKeystore
-----------

.. code-block:: typescript

   async function getKeystore(address: string): Promise<Keystore>

Description
^^^^^^^^^^^
Pulls the keystore file for a given address.

Parameters
^^^^^^^^^^
1. ``address`` - ``string``: Address to query a keystore for.

Returns
^^^^^^^
``Promise<Keystore>``: The `Keystore`_ object associated with that address.


-------------------------------------------------------------------------------

listAddresses
-------------

.. code-block:: typescript

   async function listAddresses(): Promise<string[]>

Description
^^^^^^^^^^^
Queries the list of all available account addresses with keystore files.

Returns
^^^^^^^
``Promise<string[]>``: List of account addresses where the DB has a keystore file.


.. _`keystore objects`:
.. _`standard keystore`: https://theethereum.wiki/w/index.php/Accounts,_Addresses,_Public_And_Private_Keys,_And_Tokens#UTC_JSON_Keystore_File

