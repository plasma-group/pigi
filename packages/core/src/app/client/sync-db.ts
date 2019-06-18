/* Internal Imports */
import { SyncDB, KeyValueStore, StateQuery } from '../../interfaces'
import { Key, keccak256 } from '../common'

const KEYS = {
  COMMITMENT_CONTRACTS: new Key('c', ['address'])
  DEPOSIT_CONTRACTS: new Key('d', ['address']),
  SYNC_QUERIES: new Key('s', ['hash256']),
  VALUES: new Key('v', ['buffer']),
}

/**
 * Simple SyncDB implementation.
 */
export class DefaultSyncDB implements SyncDB {
  /**
   * Initializes the database wrapper.
   * @param db Underlying database to wrap.
   */  
  constructor(private db: KeyValueStore) { }

  /**
   * @returns a list of all commitment contracts to sync with.
   */
  public async getCommitmentContracts(): Promise<string[]> {
    const key = KEYS.COMMITMENT_CONTRACTS
    const iterator = this.db.iterator({
      gte: key.min(),
      lte: key.max(),
      values: true
    })

    return await iterator.keys().map((encodedKey) => {
      const [address] = key.decode(encodedKey)
      return address.toString('hex')
    })
  }

  /**
   * Queries the list of deposit contracts to watch for a given commitment contract.
   * @param commitmentContract Commitment contract to query deposits for.
   * @returns the list of deposit contracts for the commitment contract.
   */
  public async getDepositContracts(commitmentContract: string): Promise<string[]> {
    const bucket = this.getCommitmentContractBucket(commitmentContract)

    const key = KEYS.DEPOSIT_CONTRACTS
    const iterator = bucket.iterator({
      gte: key.min(),
      lte: key.max(),
      values: true
    })

    return await iterator.keys().map((encodedKey) => {
      const [_, address] = key.decode(encodedKey)
      return address.toString('hex')
    })
  }

  /**
   * Adds a deposit contract for a given commitment contract.
   * @param commitmentContract Commitment contract to add a deposit contract for.
   * @param depositContract Deposit contract to add.
   */
  public async addDepositContract(commitmentContract: string, depositContract: string): Promise<void> {
    const bucket = this.getCommitmentContractBucket(commitmentContract)
    const key = KEYS.DEPOSIT_CONTRACTS.encode([depositContract], Buffer.from([0x01]))

    await bucket.put(key)
  }

  /**
   * Removes a deposit contract from a commitment contract.
   * @param commitmentContract Commitment contract to remove the deposit contract from.
   * @param depositContract Deposit contract to remove.
   */
  public async removeDepositContract(commitmentContract: string, depositContract: string): Promise<void> {
    const bucket = this.getCommitmentContractBucket(commitmentContract)
    const key = KEYS.DEPOSIT_CONTRACTS.encode([depositContract])

    await bucket.del(key)
  }

  /**
   * Sets the last block that was synchronized for a given commitment contract.
   * @param commitmentContract Commitment contract to update the last block for.
   * @param block Last block synchronized for the commitment contract.
   */
  public async putLastSyncedBlock(commitmentContract: string, block: number): Promise<void> {
    const key = KEYS.VALUES.encode(['last-synced-block'])
    const value = Buffer.allocUnsafe(4)
    value.writeUInt32BE(value)

    await this.db.put(key, value)
  }

  /**
   * Queries the last synchronized block for a given commitment contract.
   * @param commitmentContract Commitment contract to get the last synced block for.
   * @returns the last synced block for the commitment contract.
   */
  public async getLastSyncedBlock(commitmentContract: string): Promise<number> {
    const key = KEYS.VALUES.encode(['last-synced-block'])

    const value = await this.db.get(key)
    return value.readUInt32BE()
  }

  /**
   * Adds a synchronization query for a given commitment contract.
   * @param commitmentContract Commitment contract to add a query for.
   * @param stateQuery Synchronization query to add to the contract.
   */
  public async addSyncQuery(commitmentContract: string, stateQuery: StateQuery): Promise<void> {
    const bucket = this.getCommitmentContractBucket(commitmentContract)
    const key = KEYS.SYNC_QUERIES.encode([keccak256(stateQuery)])

    await this.db.put(key, stateQuery)
  }

  /**
   * Removes a synchronization query for a given commitment contract.
   * @param commitmentContract Commitment contract to remove a query from.
   * @param stateQuery Synchronization query to remove from the contract.
   */
  public async removeSyncQuery(commitmentContract: string, stateQuery: StateQuery): Promise<void> {
    const bucket = this.getCommitmentContractBucket(commitmentContract)
    const key = KEYS.SYNC_QUERIES.encode([keccak256(stateQuery)])

    await this.db.del(key)
  }

  /**
   * Queries the list of synchronization queries for a given commitment contract.
   * @param commitmentContract Commitment contract to get synchronization queries for.
   * @returns the list of sync queries for the contract
   */
  public async getSyncQueries(commitmentContract: string): Promise<StateQuery[]> {
    const bucket = this.getCommitmentContractBucket(commitmentContract)
    const key = KEYS.SYNC_QUERIES
    const iterator = bucket.iterator({
      gte: key.min()
      lte: key.max(),
      values: true,
    })

    return await iterator.values((stateQuery) => {
      return stateQuery // TODO: Decode this?
    })
  }

  /**
   * Opens the bucket for a given commitment contract.
   * @param commitmentContract Commitment contract to open a bucket for.
   * @returns the bucket for the contract.
   */
  private getCommitmentContractBucket(commitmentContract: string): KeyValueStore {
    return this.db.bucket(KEYS.COMMITMENT_CONTRACT.encode([commitmentContract]))
  }
}
