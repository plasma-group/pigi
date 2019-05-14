========
vyper-js
========

What is Vyper?
==============

Vyper is a new language to write and create smart contracts. It is similar to python in syntax and can generate EVM (Ethereum Virtual Machine) bytecode. It is designed to be simpler and more secure. You can learn more about Vyper `in the project documentation <https://vyper.readthedocs.io>`_


What is vyper-js?
=================

Vyper-js is a JavaScript binding to the Vyper python compiler. It allows you to compile vyper code directly from your javascript code and eases your workflow by making the process more convenient.

Vyper-js is to Vyper as solc-js is to solidity. If you have used truffle suite to compile smart contracts then you have used solc-js. Vyper-js provides similar functionality for compiling vyper contract code, and returning the associated bytecode, abi etc.

Pre-requisites
==============

To use vyper-js, you need the following prerequisites:

* **Python**: Version 3.6 or above
* **Vyper**: Vyper-js does not install vyper for you (yet!). You can install vyper via a PIP package, as a docker container or even from snap. `Read this guide. <https://vyper.readthedocs.io/en/v0.1.0-beta.9/installing-vyper.html>`_ for installation instructions for your OS.
* **Node.js and npm**

Use npm to install vyper-js with the following command::

    npm install --save @pigi/vyper-js

Using Vyper-js
--------------

The vyper-js API consists of a single function, ``vyperjs.compile``, which compiles the vyper contract at the given path and outputs the compilation result::

    vyperjs.compile(path)

Params
^^^^^^

**path** - `string`:  Path to the Vyper file to compile.

Returns
^^^^^^^

**Object**: The compilation result.
    * **bytecode** - `string`: EVM bytecode of the compiled contract.
    * **bytecodeRuntime** - `string`: `Runtime bytecode <https://ethereum.stackexchange.com/questions/32234/difference-between-bytecode-and-runtime-bytecode>`_ for the contract.
    * **abi** - `VyperAbiItem | VyperAbiItem[]`: Ethereum `contract ABI <https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI>`_
    * **sourceMap** - `Object`: Source mapping object.
        * **breakpoints** - `number[]`: List of lines that have breakpoints.
        * **pcPosMap** - `{ [key: string]: [number, number] }`: Mapping of opcode positions to `[line_number, column_offset]` in the original file.
    * **methodIdentifiers** - `{ [key: string]: string }`: Mapping of method signatures to their unique hashes.
    * **version** - `string`: Vyper compiler version used to compile the file.
