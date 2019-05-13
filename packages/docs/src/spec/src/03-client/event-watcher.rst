############
EventWatcher
############

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
4. ``callback`` - ``(eventName: string, eventData: any) => void``: Callback to be triggered whenever a matching event is detected in the smart contract.

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
4. ``callback`` - ``(eventName: string, eventData: any) => void``: Callback to be triggered whenever a matching event is detected in the smart contract.


.. _`JSON ABI`: TODO
.. _`event filter`: TODO

