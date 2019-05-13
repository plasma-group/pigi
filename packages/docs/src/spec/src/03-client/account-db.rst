#########
AccountDB
#########

``AccountDB`` stores and manages access to `standard keystore`_ files.

***
API
***

Methods
=======

setKeystore
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

listAddresses
-------------

.. code-block:: typescript

   async function listAddresses(): Promise<string[]>

Description
^^^^^^^^^^^

Queries the list of all available account addresses with keystore files.

Returns
^^^^^^^
``string[]``: List of account addresses where the DB has a keystore file.

.. _`standard keystore`: TODO
.. _`Keystore`: TODO

