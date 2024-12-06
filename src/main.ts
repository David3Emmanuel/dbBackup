import * as express from 'express'
import * as dotenv from 'dotenv'

import restoreRouter from './db-handlers/restoreHandler'
import dumpRouter from './db-handlers/dumpHandler'
import { swaggerRouter, generateDocs, swaggerConfig } from './swagger'

dotenv.config()
const app = express()

app.use(express.json())

app.use((req, _, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

app.use('/dump', dumpRouter)
app.use('/restore', restoreRouter)

swaggerConfig({
  info: {
    title: 'Database Backup and Restore API',
    version: '1.0.0',
  },
})

generateDocs()

app.use('/docs', swaggerRouter())

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err)
    res.status(500).send({
      success: false,
      message: err.message ?? 'Something went wrong.',
    })
  },
)

const PORT = process.env.PORT ?? 9000
app.listen(PORT, () => {
  console.log(`Server started on ${PORT}`)
})
