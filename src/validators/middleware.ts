import { Request, Response, NextFunction } from 'express'
import * as Joi from 'joi'

export enum SchemaKey {
  BODY = 'body',
  PARAMS = 'params',
  QUERY = 'query',
  HEADERS = 'headers',
}

export type SchemaMap = Partial<Record<SchemaKey, Joi.Schema>>

export type SchemaMapWithResponses = SchemaMap & {
  responses?: Record<number, Joi.Schema>
}

export function validate(schema: SchemaMap) {
  return (request: Request, response: Response, nextFunction: NextFunction) => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    }

    const schemas = Object.values(SchemaKey)
    const validationResults: Record<string, string> = {}

    for (const key of schemas) {
      if (schema[key]) {
        const { error, value } = schema[key].validate(
          request[key],
          validationOptions,
        )

        if (error) {
          return response.status(400).json({
            error: `Validation error in ${key}: ${error.details
              .map((x) => x.message)
              .join(', ')}`,
          })
        } else {
          validationResults[key] = value
        }
      }
    }

    Object.assign(request, validationResults)
    nextFunction()
  }
}
