/* External Imports */
import { Module } from '@nestd/core'

/* Services */
import { DBService } from './db.service'
import { EphemDBProvider } from './backends/ephem-db.provider'
import { ChainDB } from './interfaces/chain-db'
import { SyncDB } from './interfaces/sync-db'
import { WalletDB } from './interfaces/wallet-db'

@Module({
  services: [DBService, EphemDBProvider, ChainDB, SyncDB, WalletDB],
})
export class DBModule {}

/* Other Exports */
export { DBService } from './db.service'
export { BaseDBProvider } from './backends/base-db.provider'
export { EphemDBProvider } from './backends/ephem-db.provider'
export { LevelDB } from './backends/level-db'
