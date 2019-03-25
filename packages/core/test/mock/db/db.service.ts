import { DBService } from '../../../src/services'
import { EphemDB } from '../../../src/services/db/backends/ephem.db'
import { config } from '../config.service'

config.set('DB_PROVIDER', EphemDB)
export const dbservice = new DBService(config)
