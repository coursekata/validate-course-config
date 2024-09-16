export const bookSchema = {
  // $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'BookConfig',
  description: 'A configuration for a book',
  allOf: [
    {
      type: 'object',
      properties: {
        name: {
          description: "The book's name",
          type: 'string'
        },
        description: {
          description: "The book's description",
          type: 'string'
        },
        sortOrder: {
          description: 'The sort order of the book in UI menus',
          type: 'integer'
        },
        variables: {
          description:
            'Custom defined string variables to interpolate into the book',
          $ref: '#/definitions/variables'
        },
        chapters: {
          description:
            "List of book chapters (can either use key 'chapters' or 'modules')",
          $ref: '#/definitions/chapters'
        },
        modules: {
          description:
            "List of book chapters (can either use key 'chapters' or 'modules')",
          $ref: '#/definitions/chapters'
        }
      },
      required: ['name', 'sortOrder']
    },
    {
      // maybe (either modules or chapters)
      anyOf: [
        {
          oneOf: [
            { type: 'object', required: ['chapters'] },
            { type: 'object', required: ['modules'] }
          ]
        },
        {
          not: {
            type: 'object',
            required: ['chapters', 'modules']
          }
        }
      ]
    }
  ],
  definitions: {
    variables: {
      type: 'object',
      additionalProperties: {
        type: ['string', 'number']
      }
    },
    chapters: {
      type: 'array',
      items: {
        $ref: '#/definitions/chapter'
      }
    },
    chapter: {
      allOf: [
        {
          type: 'object',
          properties: {
            name: {
              description: 'The name of the chapter and LMS module',
              type: 'string'
            },
            variables: {
              description:
                'Custom defined string variables to interpolate into the chapter',
              $ref: '#/definitions/variables'
            },
            pages: {
              description:
                "List of book chapters (can either use key 'chapters' or 'modules')",
              $ref: '#/definitions/pages'
            },
            lessons: {
              description:
                "List of book chapters (can either use key 'chapters' or 'modules')",
              $ref: '#/definitions/pages'
            }
          }
        },
        {
          // maybe (either lessons or pages)
          anyOf: [
            {
              oneOf: [
                { type: 'object', required: ['lessons'] },
                { type: 'object', required: ['pages'] }
              ]
            },
            {
              not: {
                type: 'object',
                required: ['lessons', 'pages']
              }
            }
          ]
        }
      ]
    },
    pages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            description: 'The name of the lesson',
            type: 'string'
          },
          shortName: {
            description: 'A short name for the lesson to use in reports',
            type: 'string'
          },
          variables: {
            description:
              'Custom defined string variables to interpolate into the page',
            $ref: '#/definitions/variables'
          },
          file: {
            description: 'The markdown file location',
            type: 'string'
          },
          required: {
            description:
              'Indicates if the page is required to continue. If true, the student won’t be able to continue until the page is completed. If omitted, it is assumed that it is not required. This validation is only checked for real classes.',
            type: 'boolean'
          }
        }
      }
    }
  }
}
