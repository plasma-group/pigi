import { should } from '../../../setup'

/* Internal Imports */
import { SimpleConfigManager } from '../../../../src/app'

describe('SimpleConfigManager', () => {
  it('should be created with some initial config', () => {
    const key = 'key'
    const value = 'value'
    const config = {
      [key]: value,
    }
    const manager = new SimpleConfigManager(config)

    manager.get(key).should.equal(value)
  })

  it('should allow setting some key', () => {
    const manager = new SimpleConfigManager()
    const key = 'key'
    const value = 'value'

    manager.put(key, value)

    manager.get(key).should.equal(value)
  })

  it('should be able to store object values', () => {
    const manager = new SimpleConfigManager()
    const key = 'key'
    const value = {
      some: 'thing',
    }

    manager.put(key, value)

    manager.get(key).should.deep.equal(value)
  })

  it('should throw if a key does not exist', () => {
    const manager = new SimpleConfigManager()

    should.Throw(() => {
      manager.get('not-a-real-key')
    }, 'Key not found in configuration.')
  })
})
