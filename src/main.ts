import * as express from 'express'
import {
  dumpSchemaValidator,
  validate,
  restoreSchemaValidator,
} from './validators'
import restoreHandler from './db-handlers/restoreHandler'
import dumpHandler from './db-handlers/dumpHandler'

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
