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

@public
def __init__():
    assert True == True