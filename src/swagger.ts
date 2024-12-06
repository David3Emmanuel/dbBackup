import { Router, RequestHandler } from 'express'
import convert from 'joi-to-swagger'
import { SchemaMapWithResponses, validate } from './validators/middleware'
import * as swaggerUI from 'swagger-ui-express'

interface SwaggerDocs {
  openapi: string
  info: {
    title: string
    version: string
  }
  paths: any
}

interface RouteMeta {
  path: string
  method: 'get' | 'post' | 'put' | 'delete'
  summary: string
  description: string
  tags: string[]
  parameters: {
    name: string
    in: string
    required: boolean
    schema: any
    description: string
  }[]
  requestBody: {
    content?: any
  }
}

class DocBuilder {
  routes: RouteMeta[]
  info: SwaggerDocs

  constructor() {
    this.routes = []
    this.info = {
      openapi: '3.0.0',
      info: {
        title: 'API Documentation',
        version: '1.0.0',
      },
      paths: {},
    }
  }

  config(info: Partial<SwaggerDocs>) {
    this.info = { ...this.info, ...info }
  }

  generateDocs() {
    this.routes.forEach((route) => {
      const info = this.info!
      const path = route.path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}')
      if (!info.paths[path]) {
        info.paths[path] = {}
      }
      info.paths[path][route.method] = {
        summary: route.summary,
        description: route.description,
        tags: route.tags,
        parameters: route.parameters,
        requestBody: route.requestBody,
      }
    })
  }

  registerRoute(
    router: Router,
    {
      method,
      path,
      schema = {},
      handler,
      middlewares = [],
      summary,
      description,
      tags = [],
    }: {
      method: 'get' | 'post' | 'put' | 'delete'
      path: string
      schema?: SchemaMapWithResponses
      handler: RequestHandler
      middlewares?: RequestHandler[]
      summary: string
      description: string
      tags?: string[]
    },
  ) {
    if (schema && Object.keys(schema).length > 0) {
      middlewares.unshift(validate(schema))
    }

    router[method](path, ...middlewares, handler)

    const parameters = []
    const requestBody: { content?: any } = {}

    if (schema.params) {
      const { swagger: paramsSwagger } = convert(schema.params)
      parameters.push(
        ...Object.keys(paramsSwagger.properties).map((key) => ({
          name: key,
          in: path,
          required: schema.params?._flags.presence === 'required',
          schema: paramsSwagger.properties[key],
          description: paramsSwagger.properties[key].description,
        })),
      )
    }

    if (schema.query) {
      const { swagger: querySwagger } = convert(schema.query)
      parameters.push(
        ...Object.keys(querySwagger.properties).map((key) => ({
          name: key,
          in: 'query',
          required: schema.query?._flags.presence === 'required',
          schema: querySwagger.properties[key],
          description: querySwagger.properties[key].description,
        })),
      )
    }

    if (schema.body) {
      const { swagger: bodySwagger } = convert(schema.body)
      requestBody.content = {
        'application/json': {
          schema: bodySwagger,
        },
      }
    }

    this.routes.push({
      path,
      method,
      summary,
      description,
      tags,
      parameters,
      requestBody,
    })
  }
}

const docBuilder = new DocBuilder()
export const registerRoute = docBuilder.registerRoute.bind(docBuilder)
export const swaggerConfig = docBuilder.config.bind(docBuilder)
export const generateDocs = docBuilder.generateDocs.bind(docBuilder)

export function swaggerRouter() {
  const router = Router()
  router.use(swaggerUI.serve, swaggerUI.setup(docBuilder.info))

  return router
}
