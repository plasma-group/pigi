############
EventWatcher
############

***********
Description
***********
Plasma chain contracts emit various important `Ethereum contract events`_ that the client needs to be aware of. These events include things like notifications of `deposits`_ and `exits`_. ``EventWatcher`` provides the necessary functionality to watch for these events.

Event Uniqueness
================
It's often important that an event only be handled **once**. We might otherwise end up in a situation in which, for example, a client attempts to credit the same deposit twice. We also don't want to increase client load by querying the same events multiple times.

``EventWatcher`` is therefore slightly more complicated than a basic Ethereum event watcher. Each ``EventWatcher`` instance has access to a local database that it **MUST** use to store the hash of any event that's already been seen. The hash of an event is computed as the `keccak256`_ hash of the hash of the `ABI encoded transaction`_ that emitted event prepended to the index of the event.

``EventWatcher`` will also store the current block up to which it has checked for a given event on a given contract. ``EventWatcher`` **MUST** store a different block for each tuple of ``(contract, event name, event filter)``.

-------------------------------------------------------------------------------

***
API
***

Methods
=======

on
--

.. code-block:: typescript

   function on(
     contractAddress: string,
     contractAbi: any,
     eventName: string,
     eventFilter: any,
     callback: (eventName: string, eventData: any) => void
   ): void

Description
^^^^^^^^^^^
Starts watching an event for a given contract.

Parameters
^^^^^^^^^^
1. ``contractAddress`` - ``string``: Address of the contract to watch.
2. ``contractAbi`` - ``any``: `JSON ABI`_ of the contract to watch.
3. ``eventName`` - ``string``: Name of the event to watch.
4. ``eventFilter`` - ``any``: An `event filter`_ for the event.
5. ``callback`` - ``(eventName: string, eventData: any) => void``: Callback to be triggered whenever a matching event is detected in the smart contract.


-------------------------------------------------------------------------------

off
---

.. code-block:: typescript

   function off(
     contractAddress: string,
     contractAbi: any,
     eventName: string,
     eventFilter: any,
     callback: (eventName: string, eventData: any) => void
   ): void

Description
^^^^^^^^^^^
Stops watching an event for a given contract. Will only remove the listener that corresponds to the specific event name, filter, and callback provided.

Parameters
^^^^^^^^^^
1. ``contractAddress`` - ``string``: Address of the contract to watch.
2. ``contractAbi`` - ``any``: `JSON ABI`_ of the contract to watch.
3. ``eventName`` - ``string``: Name of the event to watch.
4. ``eventFilter`` - ``any``: An `event filter`_ for the event.
5. ``callback`` - ``(eventName: string, eventData: any) => void``: Callback to be triggered whenever a matching event is detected in the smart contract.


.. References

.. _`ABI encoded transaction`: ../01-core/state-system.html#id12
.. _`deposits`: ../03-client/deposit-generation.html
.. _`keccak256`: https://ethereum.stackexchange.com/questions/550/which-cryptographic-hash-function-does-ethereum-use
.. _`Ethereum contract events`: https://media.consensys.net/technical-introduction-to-events-and-logs-in-ethereum-a074d65dd61e
.. _`JSON ABI`: https://solidity.readthedocs.io/en/v0.5.9/abi-spec.html
.. _`exits`: TODO
.. _`event filter`: TODO
