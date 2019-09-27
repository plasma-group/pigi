import { ethers } from 'ethers'

export interface BlockEventHandler {
  handleBlock(block: ethers.providers.Block): Promise<void>
}
