#############
PredicateName
#############

***********
Description
***********
Detailed description of this predicate and what it does.

*************
Predicate API
*************

State Changing Methods
======================

methodName
----------

.. code-block:: javascript

   {
       name: "methodName",
       constant: false,
       inputs: [
           {
               name: "input1",
               type: "Input1Type",
           },
           {
               name: "input2",
               type: "Input2Type"
           }
       ],
       outputs: [
           {
               name: "output1",
               type: "Output1Type"
           }
       ]
   }

Description
-----------
Description of this method and its purpose.

Inputs
^^^^^^
1. ``input1`` - ``Input1Type``: Description of this input.
2. ``input2`` - ``Input2Type``: Description of this input.

Outputs
^^^^^^^
1. ``output1`` - ``Output1Type``: Description of this output.


-------------------------------------------------------------------------------

State Querying Methods
======================

queryMethodName
---------------

.. code-block:: javascript

   {
       name: "queryMethodName",
       constant: true,
       inputs: [],
       outputs: [
           {
               name: "output1",
               type: "Output1Type"
           }
       ]
   }

Description
^^^^^^^^^^^
Description of this query and its purpose.

Outputs
^^^^^^^
1. ``output1`` - ``Output1Type``: Description of this output.


-------------------------------------------------------------------------------

**********************
State Object Structure
**********************

variableName
============

.. code-block:: solidity

   VariableType variableName;

Description
-----------
Description of this variable and its purpose.

-------------------------------------------------------------------------------

********************************
Predicate Contract Specification
********************************

Methods
=======

executeStateTransition
----------------------

.. code-block:: solidity

   function executeStateTransition(
       StateUpdate memory _stateUpdate, 
       Transaction memory _transaction
   ) public

Description
^^^^^^^^^^^
Description of this method.

Parameters
^^^^^^^^^^
1. ``_stateUpdate`` - ``StateUpdate``: Description of this parameter.
2. ``_transaction`` - ``Transaction``: Description of this parameter

Requirements
^^^^^^^^^^^^
Requirements for this method.

Rationale
^^^^^^^^^
Rationale for this method.


-------------------------------------------------------------------------------


getAdditionalExitPeriod
-----------------------

.. code-block:: solidity

   function getAdditionalExitPeriod(
       Checkpoint _exit,
       bytes _witness
   ) public returns (uint256)

Description
^^^^^^^^^^^
Description of this method.

Parameters
^^^^^^^^^^
1. ``_exit`` - ``Checkpoint``: Description of this parameter.
2. ``_witness`` - ``bytes``: Description of this parameter

Returns
^^^^^^^
``uint256``: Description of the return value.

Requirements
^^^^^^^^^^^^
Requirements for this method.

Rationale
^^^^^^^^^
Rationale for this method.


-------------------------------------------------------------------------------


canStartExitGame
----------------

.. code-block:: solidity

   function canStartExitGame(
       Checkpoint _exit,
       bytes _witness
   ) public returns (boolean)

Description
^^^^^^^^^^^
Description of this method.

Parameters
^^^^^^^^^^
1. ``_exit`` - ``Checkpoint``: Description of this parameter.
2. ``_witness`` - ``bytes``: Description of this parameter

Returns
^^^^^^^
``boolean``: Description of the return value.

Requirements
^^^^^^^^^^^^
Requirements for this method.

Rationale
^^^^^^^^^
Rationale for this method.


-------------------------------------------------------------------------------


onExitGameFinalized
-------------------

.. code-block:: solidity

   function onExitGameFinalized(
       Checkpoint _exit,
       bytes _witness
   ) public 

Description
^^^^^^^^^^^
Description of this method.

Parameters
^^^^^^^^^^
1. ``_exit`` - ``Checkpoint``: Description of this parameter.
2. ``_witness`` - ``bytes``: Description of this parameter

Requirements
^^^^^^^^^^^^
Requirements for this method.

Rationale
^^^^^^^^^
Rationale for this method.


-------------------------------------------------------------------------------

*******************
Verification Plugin
*******************

Methods
=======

executeStateTransition
----------------------

.. code-block:: typescript

   async function executeStateTransition(
       stateUpdate: StateUpdate,
       transaction: Transaction
   ): Promise<StateUpdate>

Description
^^^^^^^^^^^
Description of this method.

Parameters
^^^^^^^^^^
1. ``stateUpdate`` - ``StateUpdate``: Description of this parameter.
2. ``transaction`` - ``Transaction``: Description of this parameter.

Returns
^^^^^^^
``Promise<StateUpdate>``: Description of the return value.

Requirements
^^^^^^^^^^^^
Requirements for this method.

Rationale
^^^^^^^^^
Rationale for this method.


-------------------------------------------------------------------------------


***************
Guarding Plugin
***************

.. todo::

   Add this section.


.. References
