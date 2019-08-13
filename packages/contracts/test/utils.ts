/*
 * Helper Functions
 */
export async function mineBlocks(provider: any, numBlocks: number = 1) {
  for (let i = 0; i < numBlocks; i++) {
    await provider.send('evm_mine', [])
  }
}
