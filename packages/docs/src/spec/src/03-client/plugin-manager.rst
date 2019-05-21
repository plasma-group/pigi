#############
PluginManager
#############

***********
Description
***********
The ``PluginManager`` handles loading and accessing `PredicatePlugins`_. Other components are expected to go through the ``PluginManager`` whenever they intend to access a specific ``PredicatePlugin``.

-------------------------------------------------------------------------------

***
API
***

Methods
=======

loadPlugin
----------

.. code-block:: typescript

   async function loadPlugin(
     address: string,
     path: string
   ): Promise<PredicatePlugin>

Description
^^^^^^^^^^^
Loads a plugin at a given file path and assigns it to a specific address.

Parameters
^^^^^^^^^^
1. ``address`` - ``string``: Address of the predicate to load a plugin for.
2. ``path`` - ``string``: Path to the predicate plugin to load.

Returns
^^^^^^^
``Promise<PredicatePlugin>``: The loaded `PredicatePlugin`_.

-------------------------------------------------------------------------------

getPlugin
---------

.. code-block:: typescript

   async function getPlugin(address: string): Promise<PredicatePlugin>

Description
^^^^^^^^^^^
Returns the plugin for the predicate with the given address.

Parameters
^^^^^^^^^^
1. ``address`` - ``string``: Address of the predicate to get a plugin for.

Returns
^^^^^^^
``Promise<PredicatePlugin>``: The `PredicatePlugin`_ that corresponds to the given address.

.. _`PredicatePlugin`: TODO

