/* External Imports */
import { Module } from '@nestd/core'
import { DBModule } from '@pigi/core'

/* Services */
import { RpcServerService } from './services/rpc-server.service'
import { StateService } from './services/state-manager/state.service'

@Module({
  services: [DBModule, RpcServerService, StateService],
})
export class OperatorAppModule {}
