export interface CommitmentContract {
  submitBlock(root: string): Promise<void>
}
