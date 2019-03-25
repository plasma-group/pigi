import '../../../../setup'

/* Internal Imports */
import { EphemDB } from '../../../../../src/services/db/backends/ephem.db'

describe('EphemDB', async () => {
  const db = new EphemDB()

  it('should add a new item to the database', async () => {
    const expected = 'value'
    await db.set('key', null, expected)
    const value = await db.get('key', null)

    value.should.equal(expected)
  })

  it('should remove an item from the database', async () => {
    const expected = 'value'
    await db.set('key', null, expected)
    await db.delete('key', null)

    await db
      .get('key', null)
      .should.be.rejectedWith('Key not found in database')
  })

  it('should check if an item exists', async () => {
    const expected = 'value'
    await db.set('key', null, expected)
    const exists = await db.exists('key', null)

    exists.should.be.true
  })

  it('should have a key not exist if it was removed', async () => {
    const expected = 'value'
    await db.set('key', null, expected)
    await db.delete('key', null)
    const exists = await db.exists('key', null)

    exists.should.be.false
  })
})
