/**
 * A configuration for a book.
 *
 * Created with https://transform.tools/json-schema-to-typescript
 */
export type BookConfig = {
  /**
   * The book's name
   */
  name: string
  /**
   * The book's description
   */
  description?: string
  /**
   * The sort order of the book in UI menus
   */
  sortOrder: number
  /**
   * Custom defined string variables to interpolate into the book
   */
  variables?: {
    [k: string]: string | number
  }
  /**
   * List of book chapters (can either use key 'chapters' or 'modules')
   */
  chapters?: ChapterConfig[]
  /**
   * List of book chapters (can either use key 'chapters' or 'modules')
   */
  modules?: ChapterConfig[]
  [k: string]: unknown
} & (
  | {
      [k: string]: unknown
    }
  | {
      [k: string]: unknown
    }
)

/**
 * A configuration for a chapter.
 *
 * Created with https://transform.tools/json-schema-to-typescript
 */
export type ChapterConfig = {
  /**
   * The name of the chapter and LMS module
   */
  name?: string
  /**
   * Custom defined string variables to interpolate into the chapter
   */
  variables?: {
    [k: string]: string | number
  }
  /**
   * List of book chapters (can either use key 'chapters' or 'modules')
   */
  pages?: {
    /**
     * The name of the lesson
     */
    name?: string
    /**
     * A short name for the lesson to use in reports
     */
    shortName?: string
    /**
     * Custom defined string variables to interpolate into the page
     */
    variables?: {
      [k: string]: string | number
    }
    /**
     * The markdown file location
     */
    file?: string
    /**
     * Indicates if the page is required to continue. If true, the student won’t be able to continue
     * until the page is completed. If omitted, it is assumed that it is not required. This
     * validation is only checked for real classes.
     */
    required?: boolean
    [k: string]: unknown
  }[]
  /**
   * List of book chapters (can either use key 'chapters' or 'modules')
   */
  lessons?: {
    /**
     * The name of the lesson
     */
    name?: string
    /**
     * A short name for the lesson to use in reports
     */
    shortName?: string
    /**
     * Custom defined string variables to interpolate into the page
     */
    variables?: {
      [k: string]: string | number
    }
    /**
     * The markdown file location
     */
    file?: string
    /**
     * Indicates if the page is required to continue. If true, the student won’t be able to continue
     * until the page is completed. If omitted, it is assumed that it is not required. This
     * validation is only checked for real classes.
     */
    required?: boolean
    [k: string]: unknown
  }[]
  [k: string]: unknown
} & (
  | (
      | {
          [k: string]: unknown
        }
      | {
          [k: string]: unknown
        }
    )
  | {
      [k: string]: unknown
    }
)
