import * as express from 'express'
import * as dotenv from 'dotenv'

import restoreHandler from './db-handlers/restoreHandler'
import dumpHandler from './db-handlers/dumpHandler'
import { validate } from './validators/middleware'
import { dumpSchemaValidator } from './validators/dump-schema'
import { restoreSchemaValidator } from './validators/restore-schema'

dotenv.config()
const app = express()

app.use(express.json())

app.use((req, _, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

app.post('/dump', validate(dumpSchemaValidator), dumpHandler)
app.post('/restore', validate(restoreSchemaValidator), restoreHandler)

const PORT = process.env.PORT ?? 9000
app.listen(PORT, () => {
  console.log(`Server started on ${PORT}`)
})
