export declare class Error {
  public name: string
  public message: string
  public stack: string
  constructor(message?: string)
}

const GITHUB_ISSUE_LINK = `https://github.com/plasma-group/pigi/issues/new?assignees=&labels=&template=bug_report.md&title=`

export class RuntimeException extends Error {
  constructor(private readonly msg = ``) {
    super(
      `${msg}\nIf something seems broken, please report this error on GitHub: ${GITHUB_ISSUE_LINK}`
    )
  }

  public what() {
    return this.msg
  }
}
