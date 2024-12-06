import { NextFunction, Request, Response } from 'express'
import { Schema } from 'joi'

export const validate = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body)
    if (error)
      res.status(400).json({
        message: 'Invalid request strcutre',
        error: error.message,
      })

    next()
  }
}
