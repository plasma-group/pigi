/* External Imports */
import { Module } from '@nestd/core'

/* Services */
import { DBService } from './db.service'
import { EphemDB } from './backends/ephem.db'
import { ChainDB } from './interfaces/chain-db'
import { SyncDB } from './interfaces/sync-db'
import { WalletDB } from './interfaces/wallet-db'

@Module({
  services: [DBService, EphemDB, ChainDB, SyncDB, WalletDB],
})
export class DBModule {}
