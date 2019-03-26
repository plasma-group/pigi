import '../../../../setup'

/* Internal Imports */
import { LevelDB } from '../../../../../src/services/db/backends/level-db'

/* External Imports */
const path = require('path')

describe('LevelDB', async () => {
  const db = new LevelDB(path.join(__dirname, './test-db'))

  it('should add a new item to the database', async () => {
    const expected = 'value'
    await db.put('key', expected)
    const value = (await db.get('key')).toString()
    value.should.equal(expected)
  })

  it('should remove an item from the database', async () => {
    const expected = 'value'
    await db.put('key', expected)
    await db.del('key')

    await db.get('key').should.be.rejectedWith('Key not found in database')
  })

  it('should check if an item exists', async () => {
    const expected = 'value'
    await db.put('key', expected)
    const exists = await db.exists('key')

    exists.should.be.true
  })

  it('should have a key not exist if it was removed', async () => {
    const expected = 'value'
    await db.put('key', expected)
    await db.del('key')
    const exists = await db.exists('key')

    exists.should.be.false
  })
})
