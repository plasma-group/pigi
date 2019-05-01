========
vyper-js
========

What is Vyper ?
===============

Vyper is a relatively new language to write and create smart contracts. It is similar to python in syntax and can be compiled to generate EVM (Ethereum Virtual Machine) bytecode. It is designed to be simpler and more secure. You can learn more about Vyper `here <https://vyper.readthedocs.io>`_


What is vyper-js ?
==================

Vyper-js is a simple JavaScript binding to the Vyper python compiler. It allows you to compile vyper code directly from your javascript code and eases your workflow by  making the process more convenient.

Vyper-js is analougus to Vyper just like solc-js is to solidity. If you have used truffle suite to compile smart contracts then you have used solc-js. Vyper-js provides similar functionality for compiling vyper contract code and returning the associated bytecode, abi etc.

Pre-requisites
==============

To use vyper-js, the following prerequisites are required:
----------------------------------------------------------
* Python 3.6 or above

* Vyper: Vyper-js does not install vyper for you (yet!) Vyper can be installed via a PIP package, as a docker container or even from snap. Installation instructions for your specific OS can be found `here. <https://vyper.readthedocs.io/en/v0.1.0-beta.9/installing-vyper.html>`_

* Node Js and npm: npm is the package manager used by Nodejs and you can use npm to install vyper-js from npm using

``npm install --save @pigi/vyper-js``

How to use
----------
The `vyper-js` API is pretty simple - there's currently only a single function!

**vyperjs.compile**

``vyperjs.compile(path)``

Compiles the vyper contract at the given path and outputs the compilation result

Params
^^^^^^
1. **path** - `string`:  Path to the Vyper file to compile.

Returns
^^^^^^^
1. **Object**: The compilation result.
    * **bytecode** - `string`: EVM bytecode of the compiled contract.
    * **bytecodeRuntime** - `string`: `Runtime bytecode <https://ethereum.stackexchange.com/questions/32234/difference-between-bytecode-and-runtime-bytecode>`_ for the contract.
    * **abi** - `VyperAbiItem | VyperAbiItem[]`: Ethereum `contract ABI <https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI>`_

    * **sourceMap** - `Object`: Source mapping object.
        * **breakpoints** - `number[]`: List of lines that have breakpoints.
        * **pcPosMap** - `{ [key: string]: [number, number] }`: Mapping of opcode positions to `[line_number, column_offset]` in the original file.
    * **methodIdentifiers** - `{ [key: string]: string }`: Mapping of method signatures to their unique hashes.
    * **version** - `string`: Vyper compiler version used to compile the file.

