# Based on the ERC-20 implementation by Takayuki Jimba (@yudetamago)
# Original code available here: https://github.com/ethereum/vyper/blob/9d1da6edb7f5786e68c4fd28010c9bfc361ede08/examples/tokens/ERC20.vy

# Events
Transfer: event({
    _from: indexed(address),
    _to: indexed(address),
    _value: uint256
})
Approval: event({
    _owner: indexed(address),
    _spender: indexed(address),
    _value: uint256
})

# Public Variables
name: public(bytes32)
symbol: public(bytes32)
decimals: public(uint256)

# Private Variables
balances: map(address, uint256)
allowances: map(address, map(address, uint256))
total_supply: uint256
minter: address


@public
def __init__(_name: bytes32, _symbol: bytes32, _decimals: uint256, _supply: uint256):
    """Creates the token.

    Gives the initial supply to the person who created
    the contract.

    Args:
        _name (bytes32): Name of the ERC-20 token.
        _symbol (bytes32): Short symbol for the token.
        _decimals (uint256): Number of decimals to use when
            displaying units of the token.
        _supply (uint256): Total token supply.

    """
    init_supply: uint256 = _supply * 10 ** _decimals
    self.name = _name
    self.symbol = _symbol
    self.decimals = _decimals
    self.balances[msg.sender] = init_supply
    self.total_supply = init_supply
    self.minter = msg.sender
    log.Transfer(ZERO_ADDRESS, msg.sender, init_supply)


@public
@constant
def totalSupply() -> uint256:
    """Queries the total supply.
    
    Returns:
        uint256: Total number of tokens in existence.

    """
    return self.total_supply


@public
@constant
def balanceOf(_owner: address) -> uint256:
    """Gets the balance of the specified address
    
    Args:
        _owner (address): Address to query.
    
    Returns:
        uint256: Amount owned by the specified address.

    """
    return self.balances[_owner]


@public
@constant
def allowance(_owner: address, _spender: address) -> uint256:
    """Checks the allowance given to a spender by an owner.
    
    Args:
        _owner (address): Address which owns the funds.
        _spender (address): Address which will spend the funds.
    
    returns:
        uint256: Amount of tokens still available for the spender.

    """
    return self.allowances[_owner][_spender]


@public
def transfer(_to: address, _value: uint256) -> bool:
    """Transfers tokens from the sender to an address.
    
    Args:
        _to (address): Address to transfer to.
        _value (uint256): Amount to be transferred.
    
    Returns:
        bool: True if the operation is successful.

    """
    self.balances[msg.sender] -= _value
    self.balances[_to] += _value
    log.Transfer(msg.sender, _to, _value)
    return True


@public
def transferFrom(_from: address, _to: address, _value: uint256) -> bool:
    """Transfer tokens on behalf of another account.
     
    Note that while this function emits an Approval event,
    this is not required as per the specification,
    and other compliant implementations may not emit the event.

    Args:
        _from (address): Address to transfer tokens from.
        _to (address): Address to transfer tokens to.
        _value (uint256): Amount to be transferred.

    Returns:
        bool: True if the operation is successful.

    """
    self.balances[_from] -= _value
    self.balances[_to] += _value
    self.allowances[_from][msg.sender] -= _value
    log.Transfer(_from, _to, _value)
    return True


@public
def approve(_spender: address, _value: uint256) -> bool:
    """Allows an account to spend from the sender's account.

    Beware that changing an allowance with this method brings
    the risk that someone may use both the old and the new
    allowance by unfortunate transaction ordering. One possible
    solution to mitigate this race condition is to first reduce
    the spender's allowance to 0 and set the desired value afterwards:
    https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729

    Args:
        _spender (address): Address which will spend the funds.
        _value (uint256): Amount of tokens to be spent.

    Returns:
        bool: True if the operation is successful.

    """
    self.allowances[msg.sender][_spender] = _value
    log.Approval(msg.sender, _spender, _value)
    return True


@public
def mint(_to: address, _value: uint256):
    """Mints some tokens into an account's balance.

    This encapsulates the modification of balances such that the
    proper events are emitted.

    Args:
        _to (address): Address that will receive the created tokens.
        _value (uint256): Amount that will be created.

    """
    assert msg.sender == self.minter
    assert _to != ZERO_ADDRESS
    self.total_supply += _value
    self.balances[_to] += _value
    log.Transfer(ZERO_ADDRESS, _to, _value)


@private
def _burn(_to: address, _value: uint256):
    """Burns some tokens from an account.

    Args:
        _to (address): Account whose tokens will be burned.
        _value (uint256): Amount that will be burned.

    """
    assert _to != ZERO_ADDRESS
    self.total_supply -= _value
    self.balances[_to] -= _value
    log.Transfer(_to, ZERO_ADDRESS, _value)


@public
def burn(_value: uint256):
    """Burns some tokens from the account of the sender.
    
    Args:
        _value (uint256): Amount to burn.

    """
    self._burn(msg.sender, _value)


@public
def burnFrom(_to: address, _value: uint256):
    """Burns some tokens from another account.

    Will only work if the other user has given
    msg.sender a sufficient allowance.

    Args:
        _to (address): Account to burn from.
        _value (uint256): Amount to burn.

    """
    self.allowances[_to][msg.sender] -= _value
    self._burn(_to, _value)
