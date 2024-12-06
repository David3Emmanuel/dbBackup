import * as express from 'express'
import { dumpSchemaValidator, validate } from './validators'
import { dumpHandler } from './db-handlers/globalhander'

const app = express()

app.use(express.json())

app.use((req, _, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

app.post('/dump', validate(dumpSchemaValidator), dumpHandler)

const PORT = process.env.PORT ?? 9000
app.listen(PORT, () => {
  console.log(`Server started on ${PORT}`)
})
