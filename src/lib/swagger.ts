import { createSwaggerSpec } from "next-swagger-doc"

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    // api path something might looks like './**/api'
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "API Doc",
        version: "1.0",
      },
      security: [],
    },
  })
  return spec
}
