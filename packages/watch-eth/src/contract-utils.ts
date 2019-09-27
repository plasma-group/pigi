import { ethers } from 'ethers'

export type EthereumEventHandler = (...args) => void

export const getContract = (
  address: string,
  abi: any,
  provider: any
): ethers.Contract => {
  return new ethers.Contract(address, abi, provider)
}
