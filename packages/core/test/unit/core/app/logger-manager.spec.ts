import '../../../setup'

/* Internal Imports */
import { DebugLoggerManager } from '../../../../src/app'

describe('DebugLoggerManager', () => {
  it('should create a new logger', () => {
    const manager = new DebugLoggerManager()
    const namespace = 'namespace'

    const logger = manager.create(namespace)

    logger.namespace.should.equal(namespace)
  })

  it('should return the same logger if using the same namespace', () => {
    const manager = new DebugLoggerManager()
    const namespace = 'namespace'

    const logger1 = manager.create(namespace)
    const logger2 = manager.create(namespace)

    logger1.should.equal(logger2)
  })
})
