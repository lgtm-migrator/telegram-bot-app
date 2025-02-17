import axios from 'axios'
import { trim } from 'lodash'

import { hasRussiansLetters } from '@tg-bot/common/utils'

export const searchWiki = async (query: string): Promise<string> => {
  const lang = hasRussiansLetters(query) ? 'ru' : 'en'
  const baseUrl = `https://${lang}.wikipedia.org/w/api.php`
  const url = `${baseUrl}?action=opensearch&format=json&limit=1&namespace=0&search=${encodeURIComponent(
    trim(query),
  )}`

  try {
    const response = await axios(url)
    const result = response.data
    return result[3][0] || `Failed to find article for term: ${query}`
  } catch (e) {
    return 'Wiki error'
  }
}
