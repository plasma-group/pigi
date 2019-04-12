# Constants
# transaction block number
TX_BLOCKNUM_START: constant(int128) = 0
TX_BLOCKNUM_LEN: constant(int128) = 4

# transaction transfer count
TX_NUM_TRANSFERS_START: constant(int128) = 4
TX_NUM_TRANSFERS_LEN: constant(int128) = 1

# transaction transfers
FIRST_TR_START: constant(int128) = 5
TR_LEN: constant(int128) = 68

# transfer sender
SENDER_START: constant(int128) = 0
SENDER_LEN: constant(int128) = 20

# transfer recipient
RECIPIENT_START: constant(int128) = 20
RECIPIENT_LEN: constant(int128) = 20

# transfer token
TR_TOKEN_START: constant(int128) = 40
TR_TOKEN_LEN: constant(int128) = 4

# transfer range
TR_UNTYPEDSTART_START: constant(int128) = 44
TR_UNTYPEDSTART_LEN: constant(int128) = 12
TR_UNTYPEDEND_START: constant(int128) = 56
TR_UNTYPEDEND_LEN: constant(int128) = 12

# proof node size
TREENODE_LEN: constant(int128) = 48

# parsed sum
PARSEDSUM_START: constant(int128) = 0
PARSEDSUM_LEN: constant(int128) = 16

# signatures
SIG_START:constant(int128) = 32
SIGV_OFFSET: constant(int128) = 0
SIGV_LEN: constant(int128) = 1
SIGR_OFFSET: constant(int128) = 1
SIGR_LEN: constant(int128) = 32
SIGS_OFFSET: constant(int128) = 33
SIGS_LEN: constant(int128) = 32

# proof node count
NUMPROOFNODES_START: constant(int128) = 97
NUMPROOFNODES_LEN: constant(int128) = 1

# leaf index
LEAFINDEX_START: constant(int128) = 16
LEAFINDEX_LEN: constant(int128) = 16

# inclusion proof
INCLUSIONPROOF_START: constant(int128) = 98
FIRST_TRANSFERPROOF_START: constant(int128) = 1

# transfer proof count
NUMTRPROOFS_START: constant(int128) = 0
NUMTRPROOFS_LEN: constant(int128) = 1


@public
def getLeafHash(_transactionEncoding: bytes[277]) -> bytes32:
    """Hashes a transaction.

    Args:
        _transactionEncoding (bytes): Encoded transaction.
    
    Returns:
        bytes32: Hash of the transaction.

    """
    return sha3(_transactionEncoding)


@public
def decodeBlockNumber(_transactionEncoding: bytes[277]) -> uint256:
    """Pulls the block number out of a transaction.

    Args:
        _transactionEncoding (bytes): Encoded transaction.
    
    Returns:
        uint256: Block number in which the transaction was included.

    """
    bn: bytes[32] = slice(
        _transactionEncoding,
        start = TX_BLOCKNUM_START,
        len = TX_BLOCKNUM_LEN
    )
    return convert(bn, uint256)


@public
def decodeNumTransfers(_transactionEncoding: bytes[277]) -> uint256:
    """Determines the number of transfers in a transaction.

    Args:
        _transactionEncoding (bytes): Encoded transaction.
    
    Returns:
        uint256: Number of transfers in the transaction.

    """
    num: bytes[2] = slice(
        _transactionEncoding,
        start = TX_NUM_TRANSFERS_START,
        len = TX_NUM_TRANSFERS_LEN
    )
    return convert(num, uint256)


@public
def decodeIthTransfer(
    _index: int128,
    _transactionEncoding: bytes[277]
) -> bytes[68]:
    """Pulls the ith transfer out of a transaction.

    Args:
        _index (int128): Index of the transfer to pull out.
        _transactionEncoding (bytes): Encoded transaction.
    
    Returns:
        bytes: Encoded transfer.

    """
    transfer: bytes[68] = slice(
        _transactionEncoding,
        start = TR_LEN * _index + FIRST_TR_START,
        len = TR_LEN
    )
    return transfer


@public
def bytes20ToAddress(_address: bytes[20]) -> address:
    """Converts a 20 byte array to an address.

    Args:
        _address (bytes): Address byte array.
    
    Returns:
        address: Address from the byte array.

    """
    padded: bytes[52] = concat(EMPTY_BYTES32, _address)
    return convert(convert(slice(padded, start=20, len=32), bytes32), address)


@public
def decodeSender(
    _transferEncoding: bytes[68]
) -> address:
    """Pulls out the sender from a transfer.

    Args:
        _transferEncoding (bytes): Encoded transfer.
    
    Returns:
        address: Address of the transfer's sender.

    """
    addr: bytes[20] = slice(
        _transferEncoding,
        start = SENDER_START,
        len = SENDER_LEN
    )
    return self.bytes20ToAddress(addr)


@public
def decodeRecipient(
    _transferEncoding: bytes[68]
) -> address:
    """Pulls out the recipient from a transfer.

    Args:
        _transferEncoding (bytes): Encoded transfer.
    
    Returns:
        address: Address of the transfer's recipient.

    """
    addr: bytes[20] = slice(
        _transferEncoding,
        start = RECIPIENT_START,
        len = RECIPIENT_LEN
    )
    return self.bytes20ToAddress(addr)


@public
def decodeTokenTypeBytes(
    _transferEncoding: bytes[68]
) -> bytes[4]:
    """Pulls out the bytes that represent a token type from a transfer.

    Args:
        _transferEncoding (bytes): Encoded transfer.
    
    Returns:
        bytes: ID of the transferred token.

    """
    tokenType: bytes[4] = slice(
        _transferEncoding, 
        start = TR_TOKEN_START,
        len = TR_TOKEN_LEN
    )
    return tokenType


@public
def decodeTokenType(
    transferEncoding: bytes[68]
) -> uint256:
    """Pulls out the token type from a transfer.

    Args:
        _transferEncoding (bytes): Encoded transfer.
    
    Returns:
        uint256: ID of the transferred token.

    """
    return convert(self.decodeTokenTypeBytes(transferEncoding), uint256)


@public
def getTypedFromTokenAndUntyped(
    _tokenType: uint256, 
    _coinID: uint256
) -> uint256:
    """Converts a coin ID to its "typed" form.

    Coin IDs are "untyped" by default, meaning they don't carry any information
    about the token they're representing. Two coins can have the same untyped
    ID, but two coins can *not* have the same typed ID.

    Args:
        _tokenType (uint256): ID of the token represented.
        _coinID (uint256): ID of the coin to type.
    
    Returns:
        uint256: Typed coin ID.

    """
    return _coinID + _tokenType * (256**12)


@public
def decodeTypedTransferRange(
    _transferEncoding: bytes[68]
) -> (uint256, uint256):
    """Pulls out the range from a transfer.

    Args:
        _transferEncoding (bytes): Encoded transfer.
    
    Returns:
        (uint256, uint256): Untyped start and untyped end of the range being
            transacted in the transfer.

    """
    tokenType: bytes[4] = self.decodeTokenTypeBytes(_transferEncoding)
    untypedStart: bytes[12] = slice(
        _transferEncoding,
        start = TR_UNTYPEDSTART_START,
        len = TR_UNTYPEDSTART_LEN
    )
    untypedEnd: bytes[12] = slice(
        _transferEncoding,
        start = TR_UNTYPEDEND_START,
        len = TR_UNTYPEDEND_LEN
    )
    return (
        convert(concat(tokenType, untypedStart), uint256),
        convert(concat(tokenType, untypedEnd), uint256)
    )


@public
def decodeParsedSumBytes(
    _transferProofEncoding: bytes[1749] 
) -> bytes[16]:
    """Pulls out the bytes (encoded) of the parsed sum from a transfer proof.

    Args:
        _transferProofEncoding (bytes): Encoded transfer proof.
    
    Returns:
        bytes: Bytes of the parsed sum.

    """
    parsedSum: bytes[16] = slice(
        _transferProofEncoding,
        start = PARSEDSUM_START,
        len = PARSEDSUM_LEN
    )
    return parsedSum


@public
def decodeLeafIndex(
    _transferProofEncoding: bytes[1749]
) -> int128:
    """Pulls out the leaf index from a transfer proof.

    Args:
        _transferProofEncoding (bytes): Encoded transfer proof.
    
    Returns:
        int128: Leaf index for the proof.

    """
    leafIndex: bytes[16] = slice(
        _transferProofEncoding,
        start = LEAFINDEX_START,
        len = PARSEDSUM_LEN
    )
    return convert(leafIndex, int128)


@public
def decodeSignature(
    _transferProofEncoding: bytes[1749]
) -> (
    uint256,
    uint256,
    uint256
):
    """Pulls out the signature from a transfer proof.

    Args:
        _transferProofEncoding (bytes): Encoded transfer proof.
    
    Returns:
        (uint256, uint256, uint256): v,r,s components of the signature.

    """
    sig: bytes[65] = slice(
        _transferProofEncoding,
        start = SIG_START,
        len = SIGV_LEN + SIGR_LEN + SIGS_LEN
    )
    sigV: bytes[1] = slice(sig,
        start = SIGV_OFFSET,
        len = SIGV_LEN)
    sigR: bytes[32] = slice(sig,
        start = SIGR_OFFSET,
        len = SIGR_LEN)
    sigS: bytes[32] = slice(sig,
        start = SIGS_OFFSET,
        len = SIGS_LEN)
    return (
        convert(sigV, uint256),
        convert(sigR, uint256),
        convert(sigS, uint256)
    )


@public
def decodeNumInclusionProofNodesFromTRProof(
    _transferProofEncoding: bytes[1749]
) -> int128:
    """Computes the number of nodes in an inclusion proof.

    Args:
        _transferProofEncoding (bytes): Encoded transfer proof.
    
    Returns:
        int128: Number of nodes in the inclusion proof.

    """
    numNodes: bytes[1] = slice(
        _transferProofEncoding,
        start = NUMPROOFNODES_START,
        len = NUMPROOFNODES_LEN
    )
    return convert(numNodes, int128)


@public
def decodeIthInclusionProofNode(
    _index: int128,
    _transferProofEncoding: bytes[1749]
) -> bytes[48]:
    """Decoes a specific node in the inclusion proof.

    Args:
        _index (int128): Index of the node to decode.
        _transferProofEncoding (bytes): Encoded transfer proof.
    
    Returns:
        bytes: Decoded node at the given index.

    """
    proofNode: bytes[48] = slice(
        _transferProofEncoding, 
        start = _index * TREENODE_LEN + INCLUSIONPROOF_START,
        len = TREENODE_LEN
    )
    return proofNode


@public
def decodeNumInclusionProofNodesFromTXProof(
    _transactionProofEncoding: bytes[1749]
) -> int128:
    """Computes the number of nodes in a transaction inclusion proof.

    Args:
        _transactionProofEncoding (bytes): Encoded transaction rpoof.
    
    Returns:
        int128: Number of nodes in the inclusion proof.

    """
    firstTransferProof: bytes[1749] = slice(
        _transactionProofEncoding,
        start = FIRST_TRANSFERPROOF_START,
        len = NUMPROOFNODES_START + 1
    )
    return self.decodeNumInclusionProofNodesFromTRProof(firstTransferProof)
