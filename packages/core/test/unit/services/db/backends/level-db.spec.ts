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

  it('should be able to iterate through db entries', async () => {
    const expected = ['value0', 'value1', 'value2']
    // Fill db with some dummy values
    for (let i = 0; i < 3; i++) await db.put(Buffer.from([i]), expected[i])
    // Next we will start iterating over them
    const it = await db.iterator(Buffer.from([0]))
    const results = []
    results.push(await it.next())
    results.push(await it.next())
    results.push(await it.next())
    // Make sure results match with expected
    for (const [i, r] of results.entries()) {
      r.value.toString().should.equal(expected[i])
    }
  })
})
