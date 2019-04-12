# Structs
struct deposit:
    untypedStart: uint256
    depositer: address
    precedingPlasmaBlockNumber: uint256

struct exitableRange:
    untypedStart: uint256
    isSet: bool

struct Exit:
    exiter: address
    plasmaBlockNumber: uint256
    ethBlockNumber: uint256
    tokenType: uint256
    untypedStart: uint256
    untypedEnd: uint256
    challengeCount: uint256

struct inclusionChallenge:
    exitID: uint256
    ongoing: bool

struct invalidHistoryChallenge:
    exitID: uint256
    coinID: uint256
    blockNumber: uint256
    recipient: address
    ongoing: bool

struct tokenListing:
    decimalOffset:  uint256
    contractAddress: address


# External Contracts
contract ERC20:
    def transferFrom(
        _from: address,
        _to: address,
        _value: uint256
    ) -> bool: modifying
    def transfer(_to: address, _value: uint256) -> bool: modifying

contract Serializer:
    def getLeafHash(_transactionEncoding: bytes[277]) -> bytes32: constant
    def decodeBlockNumber(
        _transactionEncoding: bytes[277]
    ) -> uint256: constant
    def decodeNumTransfers(
        _transactionEncoding: bytes[277]
    ) -> uint256: constant
    def decodeIthTransfer(
        _index: int128,
        _transactionEncoding: bytes[277]
    ) -> bytes[68]: constant
    def bytes20ToAddress(_address: bytes[20]) -> address: constant
    def decodeSender(_transferEncoding: bytes[68]) -> address: constant
    def decodeRecipient(_transferEncoding: bytes[68]) -> address: constant
    def decodeTokenTypeBytes(
        _transferEncoding: bytes[68]
    ) -> bytes[4]: constant
    def decodeTokenType(_transferEncoding: bytes[68]) -> uint256: constant
    def getTypedFromTokenAndUntyped(
        _tokenType: uint256,
        _coinID: uint256
    ) -> uint256: constant
    def decodeTypedTransferRange(
        _transferEncoding: bytes[68]
    ) -> (uint256, uint256): constant
    def decodeParsedSumBytes(
        _transferProofEncoding: bytes[4821]
    ) -> bytes[16]: constant
    def decodeLeafIndex(
        _transferProofEncoding: bytes[4821]
    ) -> int128: constant
    def decodeSignature(
        _transferProofEncoding: bytes[4821]
    ) -> (uint256,  uint256, uint256): constant
    def decodeNumInclusionProofNodesFromTRProof(
        _transferProofEncoding: bytes[4821]
    ) -> int128: constant
    def decodeIthInclusionProofNode(
        _index: int128,
        _transferProofEncoding: bytes[4821]
    ) -> bytes[48]: constant
    def decodeNumInclusionProofNodesFromTXProof(
        _transactionProofEncoding: bytes[4821]
    ) -> int128: constant
    def decodeNumTransactionProofs(
        _transactionProofEncoding: bytes[4821]
    ) -> int128: constant
    def decodeIthTransferProofWithNumNodes(
        _index: int128,
        _numInclusionProofNodes: int128,
        _transactionProofEncoding: bytes[4821]
    ) -> bytes[4821]: constant


# Events
ListingEvent: event({
    tokenType: uint256, tokenAddress: address
})

DepositEvent: event({
    plasmaBlockNumber: indexed(uint256),
    depositer: indexed(address),
    tokenType: uint256,
    untypedStart: uint256,
    untypedEnd: uint256
})

SubmitBlockEvent: event({
    blockNumber: indexed(uint256),
    submittedHash: indexed(bytes32)
})

BeginExitEvent: event({
    tokenType: indexed(uint256),
    untypedStart: indexed(uint256),
    untypedEnd: indexed(uint256),
    exiter: address,
    exitID: uint256
})

FinalizeExitEvent: event({
    tokenType: indexed(uint256),
    untypedStart: indexed(uint256),
    untypedEnd: indexed(uint256),
    exitID: uint256,
    exiter: address
})

ChallengeEvent: event({
    exitID: uint256,
    challengeID: indexed(uint256)
})


# Public Variables
# Operator
operator: public(address)
nextPlasmaBlockNumber: public(uint256)
lastPublish: public(uint256)
blockHashes: public(map(uint256, bytes32))

# Token
listings: public(map(uint256, tokenListing))
listingNonce: public(uint256)
listed: public(map(address, uint256))
ethDecimalOffset: public(uint256)

# Deposit/Exit
exits: public(map(uint256, Exit))
exitNonce: public(uint256)
exitable: public(map(uint256, map(uint256, exitableRange)))
deposits: public(map(uint256, map(uint256, deposit)))
totalDeposited: public(map(uint256, uint256))

# Challenges
inclusionChallenges: public(map(uint256, inclusionChallenge))
invalidHistoryChallenges: public(map(uint256, invalidHistoryChallenge))
challengeNonce: public(uint256)

# Setup
isSetup: public(bool)
serializer: Serializer

# Constants
MESSAGE_PREFIX: public(bytes[28])
CHALLENGE_PERIOD: public(uint256)
SPENTCOIN_CHALLENGE_PERIOD: public(uint256)
PLASMA_BLOCK_INTERVAL: constant(uint256) = 0
MAX_COINS_PER_TOKEN: public(uint256)
MAX_TREE_DEPTH: constant(int128) = 8
MAX_TRANSFERS: constant(uint256) = 4
COINID_BYTES: constant(int128) = 16
PROOF_MAX_LENGTH: constant(uint256) = 1152
ENCODING_LENGTH_PER_TRANSFER: constant(int128) = 165


@public
@constant
def checkTransferProofAndGetTypedBounds(
    _leafHash: bytes32,
    _blockNum: uint256,
    _transferProof: bytes[4821]
) -> (uint256, uint256):
    """Checks an inclusion proof and returns implicit bounds.

    We occasionally need to check that transactions actually happened by
    validating a Merkle proof of inclusion. We also need to compute so-called
    "implicit bounds" -- an additional range that a transfer implicitly proves
    is unspent.

    Args:
        _leafHash (bytes32): Hash of the encoded transfer.
        _blockNum (uint256): Block number in which the transaction was included.
        _transferProof (bytes): Inclusion proof for the transfer that shows the
            transfer was actually included in the given block.
    
    Returns:
        (uint256, uint256): The left and right boundaries that the transfer
            implicitly proves are unspent.

    """
    parsedSum: bytes[16] = self.serializer.decodeParsedSumBytes(_transferProof)
    numProofNodes: int128 = (
        self.serializer
        .decodeNumInclusionProofNodesFromTRProof(
            _transferProof
        )
    )
    leafIndex: int128 = self.serializer.decodeLeafIndex(_transferProof)

    computedNode: bytes[48] = concat(_leafHash, parsedSum)
    totalSum: uint256 = convert(parsedSum, uint256)
    leftSum: uint256 = 0
    rightSum: uint256 = 0
    pathIndex: int128 = leafIndex
    
    for nodeIndex in range(MAX_TREE_DEPTH):
        if nodeIndex == numProofNodes:
            break
        proofNode: bytes[48] = (
            self.serializer
            .decodeIthInclusionProofNode(nodeIndex, _transferProof)
        )
        siblingSum: uint256 = convert(
            slice(proofNode, start=32, len=16), uint256
        )
        totalSum += siblingSum
        hashed: bytes32
        if pathIndex % 2 == 0:
            hashed = sha3(concat(computedNode, proofNode))
            rightSum += siblingSum
        else:
            hashed = sha3(concat(proofNode, computedNode))
            leftSum += siblingSum
        totalSumAsBytes: bytes[16] = slice(
            concat(EMPTY_BYTES32, convert(totalSum, bytes32)),
            start=48,
            len=16
        )
        computedNode = concat(hashed, totalSumAsBytes)
        pathIndex /= 2
    rootHash: bytes[32] = slice(computedNode, start=0, len=32)
    rootSum: uint256 = convert(slice(computedNode, start=32, len=16), uint256)
    assert convert(rootHash, bytes32) == self.blockHashes[_blockNum]
    return (leftSum, rootSum - rightSum)


@public
@constant
def checkTransactionProofAndGetTypedTransfer(
    _transactionEncoding: bytes[277],
    _transactionProofEncoding: bytes[4821],
    _transferIndex: int128
) -> (address, address, uint256, uint256, uint256):
    """Checks a transfer proof and returns a nicely structured transfer object.

    Args:
        _transactionEncoding (bytes): Encoded transaction.
        _transactionProofEncoding (bytes): Encoded transaction inclusion proof.
        _transferIndex (int128): Index of the transfer within the transaction.
            Transactions may have more than one transfer, so the user needs to
            prove that their specific transfer was included in the transaction.

    Returns:
        (address, address, uint256, uint256, uint256): Address of the sender,
            address of the recipient, typed start of the sent range, typed end
            of the sent range, and the block in which the transfer occurred.

    """
    leafHash: bytes32 = self.serializer.getLeafHash(_transactionEncoding)
    plasmaBlockNumber: uint256 = (
        self.serializer.decodeBlockNumber(_transactionEncoding)
    )

    numTransfers: int128 = convert(
        self.serializer.decodeNumTransfers(_transactionEncoding), int128
    )
    numInclusionProofNodes: int128 = (
        self.serializer
        .decodeNumInclusionProofNodesFromTXProof(_transactionProofEncoding)
    )

    requestedTypedTransferStart: uint256
    requestedTypedTransferEnd: uint256
    requestedTransferTo: address
    requestedTransferFrom: address
    for i in range(MAX_TRANSFERS):
        if i == numTransfers:
            break

        transferEncoding: bytes[68] = (
            self.serializer.decodeIthTransfer(i, _transactionEncoding)
        )
        
        transferProof: bytes[4821] = (
            self.serializer
            .decodeIthTransferProofWithNumNodes(
                i,
                numInclusionProofNodes,
                _transactionProofEncoding
            )
        )

        implicitTypedStart: uint256
        implicitTypedEnd: uint256

        (implicitTypedStart, implicitTypedEnd) = (
            self.checkTransferProofAndGetTypedBounds(
                leafHash,
                plasmaBlockNumber,
                transferProof
            )
        )

        transferTypedStart: uint256
        transferTypedEnd: uint256

        (transferTypedStart, transferTypedEnd) = (
            self.serializer.decodeTypedTransferRange(transferEncoding)
        )

        assert implicitTypedStart <= transferTypedStart
        assert transferTypedStart < transferTypedEnd
        assert transferTypedEnd <= implicitTypedEnd

        v: uint256
        r: uint256
        s: uint256
        (v, r, s) = self.serializer.decodeSignature(transferProof)
        sender: address = self.serializer.decodeSender(transferEncoding)

        messageHash: bytes32 = sha3(concat(self.MESSAGE_PREFIX, leafHash))
        assert sender == ecrecover(messageHash, v, r, s)

        if i == _transferIndex:
            requestedTransferTo = (
                self.serializer.decodeRecipient(transferEncoding)
            )
            requestedTransferFrom = sender
            requestedTypedTransferStart = transferTypedStart
            requestedTypedTransferEnd = transferTypedEnd

    return (
        requestedTransferTo,
        requestedTransferFrom,
        requestedTypedTransferStart,
        requestedTypedTransferEnd,
        plasmaBlockNumber
    )


@public
def setup(
    _operator: address,
    _ethDecimalOffset: uint256,
    _serializer: address
):
    """Initializes the contract.

    We use a setup function instead of an __init__ function
    because of a bug where create_with_code_of doesn't correctly
    call __init__. See https://github.com/ethereum/vyper/issues/773
    for more information.

    Args:
        _operator (address): Address of the operator.
        _ethDecimalOffset (uint256): Additional decimal offset for ETH.
            For example, an offset of 1 means a deposit of 1 wei will
            credit the user with 10 tokens.
        _serializer (address): Address of the contract used to
            deserialize transaction data. Necessary because
            the contract is too big otherwise.

    """
    # Make sure we haven't called this already.
    assert self.isSetup == False

    # Save those constructor variables.
    self.operator = _operator
    self.serializer = Serializer(_serializer)
    self.ethDecimalOffset = _ethDecimalOffset

    # Set up some constants.
    self.CHALLENGE_PERIOD = 20
    self.SPENTCOIN_CHALLENGE_PERIOD =  self.CHALLENGE_PERIOD / 2
    self.MAX_COINS_PER_TOKEN = 256**12

    paddedMessagePrefix: bytes32 = (
        0x0000000019457468657265756d205369676e6564204d6573736167653a0a3332
    )
    self.MESSAGE_PREFIX = slice(
        concat(paddedMessagePrefix, paddedMessagePrefix), start = 4, len = 28
    )

    # Set up some initial values.
    self.nextPlasmaBlockNumber = 1
    self.exitNonce = 0
    self.lastPublish = 0
    self.challengeNonce = 0
    self.exitable[0][0].isSet = True
    self.listingNonce = 1

    # Make sure we can't call this again.
    self.isSetup = True


@public
def submitBlock(_hash: bytes32):
    """Adds a block to the plasma chain.

    Can only be called by the operator.

    Args:
        _hash (bytes32): Hash of the block to submit.

    """
    assert msg.sender == self.operator
    assert block.number >= self.lastPublish + PLASMA_BLOCK_INTERVAL

    log.SubmitBlockEvent(self.nextPlasmaBlockNumber, _hash)

    self.blockHashes[self.nextPlasmaBlockNumber] = _hash
    self.nextPlasmaBlockNumber += 1
    self.lastPublish = block.number


@public
def listToken(_address: address, _decimals: uint256):
    """Lists a token so it can be deposited.

    Tokens must be listed before they can be deposited.
    Attempts to deposit an unlisted token will be
    rejected. Currently we can only list ERC-20 tokens.

    Args:
        _address (address): Address of the token's contract.
        _decimals (uint256): Decimal offset for the token.

    """
    assert self.listed[_address] == 0
    
    tokenType: uint256 = self.listingNonce
    self.listingNonce += 1

    self.listed[_address] = tokenType

    self.listings[tokenType].decimalOffset = _decimals
    self.listings[tokenType].contractAddress = _address

    self.exitable[tokenType][0].isSet = True
    log.ListingEvent(tokenType, _address)


@private
def processDeposit(_owner: address, _amount: uint256, _tokenType: uint256):
    """Processes a deposit.

    Called by other (public) deposit functions
    in order to finalize a deposit for a given token.

    Args:
        _owner (address): Address to own the deposited funds.
        _amount (uint256): Amount of the token to deposit.
        _tokenType (uint256): Token to deposit.

    """
    assert _amount > 0

    oldUntypedEnd: uint256 = self.totalDeposited[_tokenType]
    oldRange: exitableRange = self.exitable[_tokenType][oldUntypedEnd]

    self.totalDeposited[_tokenType] += _amount
    newUntypedEnd: uint256 = self.totalDeposited[_tokenType]
    clear(self.exitable[_tokenType][oldUntypedEnd])
    self.exitable[_tokenType][newUntypedEnd] = oldRange

    self.deposits[_tokenType][newUntypedEnd].untypedStart = oldUntypedEnd
    self.deposits[_tokenType][newUntypedEnd].depositer = _owner
    self.deposits[_tokenType][newUntypedEnd].precedingPlasmaBlockNumber = (
        self.nextPlasmaBlockNumber - 1
    )

    log.DepositEvent(
        self.nextPlasmaBlockNumber - 1,
        _owner,
        _tokenType,
        oldUntypedEnd,
        newUntypedEnd
    )


@public
@payable
def depositETH():
    """Allows a user to deposit ETH.

    Since ETH doesn't conform to the ERC-20 standard,
    we need a custom function to support ETH deposits.
    Simply allows the user to deposit ETH by sending
    it to the contract.

    """
    weiMuiltiplier: uint256 = 10**self.ethDecimalOffset
    depositAmount: uint256 = as_unitless_number(msg.value) * weiMuiltiplier
    self.processDeposit(msg.sender, depositAmount, 0)


@public
def depositERC20(_address: address, _amount: uint256):
    """Allows a user to deposit an ERC-20 token.

    Args:
        _address (address): Address of the token to deposit.
        _amount (uint256): Amount of the token to deposit.

    """
    depositer: address = msg.sender

    tokenType: uint256 = self.listed[_address]
    assert tokenType > 0

    passed: bool = ERC20(_address).transferFrom(depositer, self, _amount)
    assert passed

    tokenMultiplier: uint256 = 10 ** self.listings[tokenType].decimalOffset
    depositInPlasmaCoins: uint256 = _amount * tokenMultiplier
    self.processDeposit(depositer, depositInPlasmaCoins, tokenType)


@public
def beginExit(
    _tokenType: uint256,
    _blockNumber: uint256,
    _untypedStart: uint256,
    _untypedEnd: uint256
) -> uint256:
    """Starts an exit.

    Args:
        _tokenType (uint256): ID of the token to withdraw.
        _blockNumber (uint256): Block in which the transaction we're
            withdrawing from was included.
        _untypedStart (uint256): Start of the range to withdraw.
        _untypedEnd (uint256): End of the range to withdraw.

    Returns:
        uint256: ID of the exit.

    """
    assert _blockNumber < self.nextPlasmaBlockNumber

    exiter: address = msg.sender

    exitID: uint256 = self.exitNonce
    self.exits[exitID].exiter = exiter
    self.exits[exitID].plasmaBlockNumber = _blockNumber
    self.exits[exitID].ethBlockNumber = block.number
    self.exits[exitID].tokenType = _tokenType
    self.exits[exitID].untypedStart = _untypedStart
    self.exits[exitID].untypedEnd = _untypedEnd
    self.exits[exitID].challengeCount = 0

    self.exitNonce += 1

    log.BeginExitEvent(_tokenType, _untypedStart, _untypedEnd, exiter, exitID)
    
    return exitID


@public
@constant
def checkRangeExitable(
    _tokenType: uint256,
    _untypedStart: uint256,
    _untypedEnd: uint256,
    _claimedExitableEnd: uint256
) -> bool:
    """Checks whether a range can be exited.

    Args:
        _tokenType (uint256): ID of the token to withdraw.
        _untypedStart (uint256): Start of the range to withdraw.
        _untypedEnd (uint256): End of the range to withdraw.
        _claimedExitableEnd (uint256): The exitable end for that range.

    Returns:
        bool: True if the range can be exited.

    """
    assert _untypedEnd <= self.MAX_COINS_PER_TOKEN
    assert _untypedEnd <= _claimedExitableEnd
    assert _untypedStart >= (
        self.exitable[_tokenType][_claimedExitableEnd].untypedStart
    )
    assert self.exitable[_tokenType][_claimedExitableEnd].isSet

    return True


@private
def removeFromExitable(
    _tokenType: uint256,
    _untypedStart: uint256,
    _untypedEnd: uint256,
    _exitableEnd: uint256
):
    """Marks a range as exited.

    We need to remove the range from the set of "exitable" ranges. Otherwise,
    it's possible for a user to withdraw the same range twice. This would be
    an attack vector that would allow a user to drain the contract.

    Args:
        _tokenType (uint256): ID of the token that was exited.
        _untypedStart (uint256): Start of the exited range.
        _untypedEnd (uint256): End of the exited range.
        _exitableEnd (uint256): The exitable end for the exited range.

    """

    oldUntypedStart: uint256 = (
        self.exitable[_tokenType][_exitableEnd].untypedStart
    )
    if _untypedStart != oldUntypedStart:
        self.exitable[_tokenType][_untypedStart].untypedStart = oldUntypedStart
        self.exitable[_tokenType][_untypedStart].isSet = True
    if _untypedEnd != _exitableEnd:
        self.exitable[_tokenType][_exitableEnd].untypedStart = _untypedEnd
        self.exitable[_tokenType][_exitableEnd].isSet = True
    else:
        if _untypedEnd != self.totalDeposited[_tokenType]:
            clear(self.exitable[_tokenType][_untypedEnd])
        else:
            self.exitable[_tokenType][_untypedEnd].untypedStart = _untypedEnd


@public
def finalizeExit(_exitID: uint256, _exitableEnd: uint256):
    """Finalizes an exit.

    Exits need to be "finalized" after they've finished their challenge period.
    This is because it's not really possible for a transaction in one block to
    cause a state transition in another block. Only exits that were not
    challenged can be finalized.

    Args:
        _exitID (uint256): ID of the exit to finalize.
        _exitableEnd (uint256): Exitable end for the exited range.

    """
    exiter: address = self.exits[_exitID].exiter
    exitETHBlockNumber: uint256 = self.exits[_exitID].ethBlockNumber
    exitToken: uint256 = 0
    exitUntypedStart: uint256  = self.exits[_exitID].untypedStart
    exitUntypedEnd: uint256 = self.exits[_exitID].untypedEnd
    challengeCount: uint256 = self.exits[_exitID].challengeCount
    tokenType: uint256 = self.exits[_exitID].tokenType

    assert challengeCount == 0
    assert block.number > exitETHBlockNumber + self.CHALLENGE_PERIOD

    self.checkRangeExitable(
        tokenType, exitUntypedStart, exitUntypedEnd, _exitableEnd
    )
    self.removeFromExitable(
        tokenType, exitUntypedStart, exitUntypedEnd, _exitableEnd
    )

    if tokenType == 0:
        weiMiltiplier: uint256 = 10**self.ethDecimalOffset
        exitValue: uint256 = (
            (exitUntypedEnd - exitUntypedStart) / weiMiltiplier
        )
        send(exiter, as_wei_value(exitValue, "wei"))
    else:
        tokenMultiplier: uint256 = 10**self.listings[tokenType].decimalOffset
        exitValue: uint256 = (
            (exitUntypedEnd - exitUntypedStart) / tokenMultiplier
        )

        passed: bool = (
            ERC20(self.listings[tokenType].contractAddress)
            .transfer(exiter, exitValue)
        )
        assert passed

    log.FinalizeExitEvent(
        tokenType, exitUntypedStart, exitUntypedEnd, _exitID, exiter
    )


@public
def challengeBeforeDeposit(
    _exitID: uint256,
    _coinID: uint256,
    _depositUntypedEnd: uint256
):
    """Challenge for exits from blocks before the range was deposited.

    It's possible for someone to start an exit of a range from a block that
    comes *before* the block in which the range was actually deposited. This
    can happen if the operator includes such a transaction without the
    knowledge of the person who deposited the range. We therefore need to
    provide a challenge that allows someone to point to the deposit and block
    the exit.

    Args:
        _exitID (uint256): ID of the exit to challenge.
        _coinID (uint256): ID of the coin to challenge. Coin must be included
            in the range referenced by the exit for the challenge to be valid.
        _depositUntypedEnd (uint256): End of the deposited range that covers
            the referenced coin ID.

    """
    exitTokenType: uint256 = self.exits[_exitID].tokenType

    depositPrecedingPlasmaBlock: uint256 = (
        self.deposits[exitTokenType][_depositUntypedEnd]
        .precedingPlasmaBlockNumber
    )
    assert self.deposits[exitTokenType][_depositUntypedEnd].depositer != (
        ZERO_ADDRESS
    )

    depositUntypedStart: uint256 = (
        self.deposits[exitTokenType][_depositUntypedEnd].untypedStart
    )

    tokenType: uint256 = self.exits[_exitID].tokenType
    depositTypedStart: uint256 = (
        self.serializer
        .getTypedFromTokenAndUntyped(tokenType, depositUntypedStart)
    )
    depositTypedEnd: uint256 = (
        self.serializer
        .getTypedFromTokenAndUntyped(tokenType, _depositUntypedEnd)
    )

    assert _coinID >= depositTypedStart
    assert _coinID < depositTypedEnd

    assert depositPrecedingPlasmaBlock > self.exits[_exitID].plasmaBlockNumber

    clear(self.exits[_exitID])


@public
def challengeInclusion(_exitID: uint256):
    """Challenge for exits from transactions that weren't included.

    Since we don't require users to submit inclusion proofs when starting
    exits, it's possible for a user to start an exit from a transaction that
    doesn't actually exist. Once this challenge is started, the original
    user may respond within a set period of time.

    Args:
        _exitID (uint256): ID of the exit to challenge.

    """
    assert _exitID < self.exitNonce

    exitethBlockNumber: uint256 = self.exits[_exitID].ethBlockNumber
    assert block.number < exitethBlockNumber + self.CHALLENGE_PERIOD

    challengeID: uint256 = self.challengeNonce
    self.inclusionChallenges[challengeID].exitID = _exitID

    self.inclusionChallenges[challengeID].ongoing = True
    self.exits[_exitID].challengeCount += 1

    self.challengeNonce += 1

    log.ChallengeEvent(_exitID, challengeID)


@public
def respondTransactionInclusion(
    _challengeID: uint256,
    _transferIndex: int128,
    _transactionEncoding: bytes[277],
    _transactionProofEncoding: bytes[4821],
):
    """Response for inclusion challenges.

    This method allows users to respond to challenges asserting that a given
    exit references a transaction that wasn't included. The user must provide
    the full transaction as well as an inclusion proof showing that the
    transaction was, indeed, part of the specified block.

    Args:
        _challengeID (uint256): ID of the challenge to respond to.
        _transferIndex (int128): Index of the transfer within the transaction.
            Transactions may have more than one transfer, so the user needs to
            prove that their specific transfer was included in the transaction.
        _transactionEncoding (bytes): Encoded transaction.
        _transactionProofEncoding (bytes): Encoded transaction inclusion proof.

    """
    assert self.inclusionChallenges[_challengeID].ongoing

    transferTypedStart: uint256
    transferTypedEnd: uint256
    transferRecipient: address
    transferSender: address
    responseBlockNumber: uint256

    (
        transferRecipient,
        transferSender,
        transferTypedStart, 
        transferTypedEnd, 
        responseBlockNumber
    ) = self.checkTransactionProofAndGetTypedTransfer(
        _transactionEncoding,
        _transactionProofEncoding,
        _transferIndex
    )

    exitID: uint256 = self.inclusionChallenges[_challengeID].exitID
    exiter: address = self.exits[exitID].exiter
    exitPlasmaBlockNumber: uint256 = self.exits[exitID].plasmaBlockNumber

    assert transferRecipient == exiter

    assert exitPlasmaBlockNumber == responseBlockNumber

    exitTokenType: uint256 = self.exits[exitID].tokenType
    exitTypedStart: uint256 = (
        self.serializer
        .getTypedFromTokenAndUntyped(
            exitTokenType, self.exits[exitID].untypedStart
        )
    )
    exitTypedEnd: uint256 = (
        self.serializer
        .getTypedFromTokenAndUntyped(
            exitTokenType,
            self.exits[exitID].untypedEnd
        )
    )

    assert transferTypedStart >= exitTypedStart
    assert transferTypedEnd <= exitTypedEnd

    clear(self.inclusionChallenges[_challengeID])
    self.exits[exitID].challengeCount -= 1


@public
def respondDepositInclusion(
    _challengeID: uint256,
    _depositUntypedEnd: uint256
):
    """Response for inclusion challenges on deposits.

    Users are allowed to directly withdraw from deposits. However, it's not
    possible to provide an inclusion proof for deposits because they're not
    part of any block. This method can be used to respond to inclusion
    challenges on exits from deposits.

    Args:
        _challengeID (uint256): ID of the challenge to respond to.
        _depositUntypedEnd (uint256): End of the range that was originally
            deposited. Something like a unique deposit identifier, used to
            look up the deposit.

    """
    assert self.inclusionChallenges[_challengeID].ongoing
    
    exitID: uint256 = self.inclusionChallenges[_challengeID].exitID
    exiter: address = self.exits[exitID].exiter
    exitPlasmaBlockNumber: uint256 = self.exits[exitID].plasmaBlockNumber
    exitTokenType: uint256 = self.exits[exitID].tokenType

    depositer: address = (
        self.deposits[exitTokenType][_depositUntypedEnd].depositer
    )
    assert depositer == exiter

    depositBlockNumber: uint256 = (
        self.deposits[exitTokenType][_depositUntypedEnd]
        .precedingPlasmaBlockNumber
    )
    assert exitPlasmaBlockNumber == depositBlockNumber

    exitTypedStart: uint256 = (
        self.serializer
        .getTypedFromTokenAndUntyped(
            exitTokenType, self.exits[exitID].untypedStart
        )
    )
    exitTypedEnd: uint256 = (
        self.serializer
        .getTypedFromTokenAndUntyped(
            exitTokenType, self.exits[exitID].untypedEnd
        )
    )

    depositTypedStart: uint256 = (
        self.serializer
        .getTypedFromTokenAndUntyped(
            exitTokenType,
            self.deposits[exitTokenType][_depositUntypedEnd].untypedStart
        )
    )
    depositTypedEnd: uint256 = (
        self.serializer
        .getTypedFromTokenAndUntyped(exitTokenType, _depositUntypedEnd)
    )

    assert depositTypedStart >= exitTypedStart
    assert depositTypedEnd <= exitTypedEnd

    clear(self.inclusionChallenges[_challengeID])
    self.exits[exitID].challengeCount -= 1


@public
def challengeSpentCoin(
    _exitID: uint256,
    _coinID: uint256,
    _transferIndex: int128,
    _transactionEncoding: bytes[277],
    _transactionProofEncoding: bytes[4821],
):
    """Challenge for exits that are withdrawing an already spent coin.

    Since the plasma chain contract doesn't know what's going on inside the
    plasma chain, it's possible for someone to spend a coin and then attempt to
    exit the same coin. We therefore need a challenge that allows someone to
    prove that a given coin was spent by the user attempting to exit.

    Args:
        _exitID (uint256): ID of the exit to challenge.
        _coinID (uint256): ID of a coin within the range being exited to
            specifically point out and challenge.
        _transferIndex (uint256): Index of the transfer within a transaction
            that specifically spends the referenced coin.
        _transactionEncoding (bytes): Encoded transaction.
        _transactionProofEncoding (bytes): Encoded transaction inclusion proof.

    """
    exitethBlockNumberNumber: uint256 = self.exits[_exitID].ethBlockNumber
    assert block.number < (
        exitethBlockNumberNumber + self.SPENTCOIN_CHALLENGE_PERIOD
    )

    transferTypedStart: uint256
    transferTypedEnd: uint256
    transferRecipient: address
    transferSender: address
    bn: uint256

    (
        transferRecipient,
        transferSender,
        transferTypedStart, 
        transferTypedEnd, 
        bn
    ) = self.checkTransactionProofAndGetTypedTransfer(
        _transactionEncoding,
        _transactionProofEncoding,
        _transferIndex
    )

    exiter: address = self.exits[_exitID].exiter
    exitPlasmaBlockNumber: uint256 = self.exits[_exitID].plasmaBlockNumber
    exitTokenType: uint256 = self.exits[_exitID].tokenType
    exitTypedStart: uint256 = (
        self.serializer
        .getTypedFromTokenAndUntyped(
            exitTokenType, self.exits[_exitID].untypedStart
        )
    )
    exitTypedEnd: uint256 = (
        self.serializer
        .getTypedFromTokenAndUntyped(
            exitTokenType, self.exits[_exitID].untypedEnd
        )
    )

    assert bn > exitPlasmaBlockNumber

    assert _coinID >=  exitTypedStart
    assert _coinID < exitTypedEnd
    assert _coinID >= transferTypedStart
    assert _coinID < transferTypedEnd

    assert transferSender == exiter

    clear(self.exits[_exitID])


@private
def challengeInvalidHistory(
    _exitID: uint256,
    _coinID: uint256,
    _claimant: address,
    _typedStart: uint256,
    _typedEnd: uint256,
    _blockNumber: uint256
):
    """Challenge for exits of ranges with an invalid history.

    It's possible for a malicious operator to insert transactions of a coin
    that aren't actually signed by the current owner. Although these
    transactions aren't valid, it's still possible for the operator to then
    attempt withdrawals of the coin. This challenge forces the user who
    started the exit to prove that a valid spend of the coin exists.
    Since the malicious operator could only add invalid transactions, they
    won't be able to respond.

    Args:
        _exitID (uint256): ID of the exit to challenge.
        _coinID (uint256): ID of a coin within the range being exited to
            specifically point out and challenge.
        _claimant (address): User who originally owned the coin.
        _typedStart (uint256): Start of the range being exited.
        _typedEnd (uint256): End of the range being exited.
        _blockNumber (uint256): Block in which the last known valid spend
            occurred.

    """
    exitethBlockNumberNumber: uint256 = self.exits[_exitID].ethBlockNumber
    assert block.number < exitethBlockNumberNumber + self.CHALLENGE_PERIOD

    assert _blockNumber < self.exits[_exitID].plasmaBlockNumber

    tokenType: uint256 = self.exits[_exitID].tokenType
    exitTypedStart: uint256 = (
        self.serializer
        .getTypedFromTokenAndUntyped(
            tokenType, self.exits[_exitID].untypedStart
        )
    )
    exitTypedEnd: uint256 = (
        self.serializer
        .getTypedFromTokenAndUntyped(
            tokenType, self.exits[_exitID].untypedEnd
        )
    )

    assert _coinID >= exitTypedStart
    assert _coinID < exitTypedEnd

    assert _coinID >= _typedStart
    assert _coinID < _typedEnd

    assert _exitID < self.exitNonce

    challengeID: uint256 = self.challengeNonce
    self.exits[_exitID].challengeCount += 1
    
    self.challengeNonce += 1

    self.invalidHistoryChallenges[challengeID].ongoing = True
    self.invalidHistoryChallenges[challengeID].exitID = _exitID
    self.invalidHistoryChallenges[challengeID].coinID = _coinID
    self.invalidHistoryChallenges[challengeID].recipient = _claimant
    self.invalidHistoryChallenges[challengeID].blockNumber = _blockNumber

    log.ChallengeEvent(_exitID, challengeID)


@public
def challengeInvalidHistoryWithTransaction(
    _exitID: uint256,
    _coinID: uint256,
    _transferIndex: int128,
    _transactionEncoding: bytes[277],
    _transactionProofEncoding: bytes[4821]
):
    """Starts an invalid history challenge from a transaction.

    Allows a user to start an invalid history challenge (as described above) by
    referencing a transaction that previously occurred in the coin's history.

    Args:
        _exitID (uint256): ID of the exit to challenge.
        _coinID (uint256): ID of a coin within the range being exited to
            specifically point out and challenge.
        _transferIndex (uint256): Index of the transfer within a transaction
            that specifically spends the referenced coin.
        _transactionEncoding (bytes): Encoded transaction.
        _transactionProofEncoding (bytes): Encoded transaction inclusion proof.

    """
    transferTypedStart: uint256
    transferTypedEnd: uint256
    transferRecipient: address
    transferSender: address
    bn: uint256
    (
        transferRecipient,
        transferSender,
        transferTypedStart, 
        transferTypedEnd, 
        bn
    ) = self.checkTransactionProofAndGetTypedTransfer(
        _transactionEncoding,
        _transactionProofEncoding,
        _transferIndex
    )

    self.challengeInvalidHistory(
        _exitID,
        _coinID,
        transferRecipient,
        transferTypedStart,
        transferTypedEnd,
        bn
    )


@public
def challengeInvalidHistoryWithDeposit(
    _exitID: uint256,
    _coinID: uint256,
    _depositUntypedEnd: uint256
):
    """Starts an invalid history challenge by referencing a deposit.

    Allows a user to start an invalid history challenge by referencing a
    deposit that the user claims is unspent.

    Args:
        _exitID (uint256): ID of the exit to challenge.
        _coinID (uint256): ID of a coin within the range being exited to
            specifically point out and challenge.
        _depositUntypedEnd (uint256): End of the range that was originally
            deposited. Something like a unique deposit identifier, used to
            look up the deposit.

    """
    tokenType: uint256 = self.exits[_exitID].tokenType
    depositer: address = self.deposits[tokenType][_depositUntypedEnd].depositer
    assert depositer != ZERO_ADDRESS

    depositBlockNumber: uint256 = (
        self.deposits[tokenType][_depositUntypedEnd].precedingPlasmaBlockNumber
    )

    depositTypedStart: uint256 = (
        self.serializer
        .getTypedFromTokenAndUntyped(
            tokenType, self.deposits[tokenType][_depositUntypedEnd].untypedStart
        )
    )
    depositTypedEnd: uint256 = (
        self.serializer
        .getTypedFromTokenAndUntyped(tokenType, _depositUntypedEnd)
    )

    self.challengeInvalidHistory(
        _exitID,
        _coinID,
        depositer,
        depositTypedStart,
        depositTypedEnd,
        depositBlockNumber
    )


@public
def respondInvalidHistoryTransaction(
    _challengeID: uint256,
    _transferIndex: int128,
    _transactionEncoding: bytes[277],
    _transactionProofEncoding: bytes[4821],
):
    """Response for invalid history challenges.

    Allows a user to respond to an invalid history challenge by revealing a
    valid spend of the coin.

    Args:
        _challengeID (uint256): ID of the challenge to respond to.
        _transferIndex (uint256): Index of the transfer within a transaction
            that specifically spends the referenced coin.
        _transactionEncoding (bytes): Encoded transaction.
        _transactionProofEncoding (bytes): Encoded transaction inclusion proof.

    """
    assert self.invalidHistoryChallenges[_challengeID].ongoing

    transferTypedStart: uint256
    transferTypedEnd: uint256
    transferRecipient: address
    transferSender: address
    bn: uint256

    (
        transferRecipient,
        transferSender,
        transferTypedStart, 
        transferTypedEnd, 
        bn
    ) = self.checkTransactionProofAndGetTypedTransfer(
        _transactionEncoding,
        _transactionProofEncoding,
        _transferIndex
    )

    chalCoinID: uint256 = self.invalidHistoryChallenges[_challengeID].coinID
    assert chalCoinID >= transferTypedStart
    assert chalCoinID  < transferTypedEnd

    chalRecipient: address = self.invalidHistoryChallenges[_challengeID].recipient
    assert chalRecipient == transferSender

    exitID: uint256 = self.invalidHistoryChallenges[_challengeID].exitID
    exitPlasmaBlockNumber: uint256 = self.exits[exitID].plasmaBlockNumber
    chalBlockNumber: uint256 = self.invalidHistoryChallenges[_challengeID].blockNumber
    
    assert bn > chalBlockNumber
    assert bn <= exitPlasmaBlockNumber

    clear(self.invalidHistoryChallenges[_challengeID])
    self.exits[exitID].challengeCount -= 1


@public
def respondInvalidHistoryDeposit(
    _challengeID: uint256,
    _depositUntypedEnd: uint256
):
    """Response for invalid history challenges from invalid blocks.

    It's possible for the operator to include transactions of a coin *before*
    that coin was actually deposited. The operator could then use these
    invalid transactions to start invalid history challenges. This response
    type allows the user to show that the coin was deposited *after* the
    invalid history challenge and that the challenge is therefore invalid.

    Args:
        _challengeID (uint256): ID of the challenge to respond to.
        _depositUntypedEnd (uint256): End of the range that was originally
            deposited. Something like a unique deposit identifier, used to
            look up the deposit.

    """
    assert self.invalidHistoryChallenges[_challengeID].ongoing

    exitID: uint256 = self.invalidHistoryChallenges[_challengeID].exitID
    exitTokenType: uint256 = self.exits[exitID].tokenType

    assert self.deposits[exitTokenType][_depositUntypedEnd].depositer != (
        ZERO_ADDRESS
    )

    chalCoinID: uint256 = self.invalidHistoryChallenges[_challengeID].coinID
    depositUntypedStart: uint256 = (
        self.deposits[exitTokenType][_depositUntypedEnd].untypedStart
    )

    depositTypedStart: uint256 = (
        self.serializer
        .getTypedFromTokenAndUntyped(exitTokenType, depositUntypedStart)
    )
    depositTypedEnd: uint256 = (
        self.serializer
        .getTypedFromTokenAndUntyped(exitTokenType, _depositUntypedEnd)
    )
    
    assert chalCoinID >= depositTypedStart
    assert chalCoinID <= depositTypedEnd

    chalBlockNumber: uint256 = (
        self.invalidHistoryChallenges[_challengeID].blockNumber
    )
    exitPlasmaBlockNumber: uint256 = self.exits[exitID].plasmaBlockNumber
    depositBlockNumber: uint256 = (
        self.deposits[exitTokenType][_depositUntypedEnd]
        .precedingPlasmaBlockNumber
    )

    assert depositBlockNumber > chalBlockNumber
    assert depositBlockNumber <= exitPlasmaBlockNumber

    clear(self.invalidHistoryChallenges[_challengeID])
    self.exits[exitID].challengeCount -= 1
