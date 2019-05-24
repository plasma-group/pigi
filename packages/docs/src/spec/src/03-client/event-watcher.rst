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

``EventWatcher`` is therefore slightly more complicated than a basic Ethereum event watcher. Each ``EventWatcher`` instance has access to a local database that it **MUST** use to store the hash of any event that's already been seen. The hash of an event is computed as the `keccak256`_ hash of the `hash of the transaction`_ that emitted event prepended to the `index of the event`_.

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


.. _`Ethereum contract events`: TODO
.. _`deposits`: TODO
.. _`exits`: TODO
.. _`keccak256`: TODO
.. _`hash of the transaction`: TODO
.. _`index of the event`: TODO
.. _`JSON ABI`: TODO
.. _`event filter`: TODO

