########
Range DB
########

***********
Description
***********
``RangeDB`` is a database abstraction that makes it easy to map ranges, defined by a ``start`` and an ``end``, to arbitrary values.

***************
Data Structures
***************

RangeEntry
==========

.. code-block: typescript

   interface RangeEntry {
     start: number
     end: number
     value: Buffer
   }

Description
-----------
Represents a value in the database. All values are constructed with respect to some range, defined by ``start`` and ``end``.

Fields
------
1. ``start`` - ``number``: Start of the range described by this entry.
2. ``end`` - ``number``: End of the range described by this entry.
3. ``value`` - ``Buffer``: Value at this specific range.


***
API
***

Methods
=======

get
---

.. code-block:: typescript

   async function get(start: number, end: number): Promise<RangeEntry[]>

Description
^^^^^^^^^^^
Queries ``RangeEntry`` values that intersect with a given ``start`` and ``end``. Ranges **must** be treated as start-inclusive and end-exclusive.

Parameters
^^^^^^^^^^
1. ``start`` - ``number``: Start of the range to query.
2. ``end`` - ``number``: End of the range to query.

Returns
^^^^^^^
``Promise<RangeEntry[]>``: All ``RangeEntry`` objects in the database such that ``entry.start`` and ``entry.end`` intersect with the given ``start`` and ``end``.

put
---

.. code-block:: typescript

   async function put(start: number, end: number, value: Buffer): Promise<void>

Description
^^^^^^^^^^^
Adds a value to the database at a given range. Overwrites all existing ``RangeEntry`` objects that overlap with the range. ``put`` **must** modify or break apart existing ``RangeEntry`` objects if the given range only partially overlaps with the object. For example, if we currently have a ``RangeEntry`` over the range ``(0, 100)`` and call ``put(25, 75, "some value")``, this function must break the existing ``RangeEntry`` into new entries for ``(0, 25)`` and ``(75, 100)``.

Parameters
^^^^^^^^^^
1. ``start`` - ``number``: Start of the range to insert into.
2. ``end`` - ``number``: End of the range to insert into.
3. ``value`` - ``Buffer``: Value to insert into the range as a `Buffer`_.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the range has been inserted.

del
---

.. code-block:: typescript

   async function del(start: number, end: number): Promise<void>

Description
^^^^^^^^^^^
Deletes the values for the given range. Will insert new ``RangeEntry`` objects or modify existing ones when the given range only partially overlaps with those already in the database. This method **must** delete objects under the same scheme described above for ``put``.

Parameters
^^^^^^^^^^
1. ``start`` - ``number``: Start of the range to delete.
2. ``end`` - ``number``: End of the range to delete.

Returns
^^^^^^^
``Promise<void>``: Promise which resolves once the range has been deleted.


.. _`Buffer`: https://nodejs.org/api/buffer.html

