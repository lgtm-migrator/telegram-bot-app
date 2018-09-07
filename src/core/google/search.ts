import { every, filter, get, includes, sample } from 'lodash'
import fetch from 'node-fetch'

import { segments } from '../../'

const googleSearchToken = process.env.GOOGLE_SEARCH_TOKEN || 'set_your_token'
const cxToken = process.env.GOOGLE_CX_TOKEN || 'set_your_token'

const isResponseImage = (headers: Headers) => headers.get('content-type')!.split('/')[0] === 'image'
const filterMimeTypes = (item: any) => every(['ico', 'svg'], x => !includes(item.mime, x))

function getImage(url: string, tbUrl: string) {
  return fetch(url, { timeout: 10000 })
    .then(response => isResponseImage(response.headers) ? Promise.resolve(response) : Promise.reject(null))
    .then(res => res.buffer())
    .catch(() => {
      if (tbUrl) {
        return fetch(tbUrl, { timeout: 10000 })
          .then(res => isResponseImage(res.headers) ? Promise.resolve(res) : Promise.reject(null))
          .then(res => res.buffer())
      }
      return Promise.reject(null)
    })
}

export const searchImage = (query: string) => {
  const url = 'https://www.googleapis.com/customsearch/v1?searchType=image&num=10&filter=1&gl=by' +
    `&key=${googleSearchToken}&cx=${cxToken}&q=${encodeURI(query)}`

  return fetch(url, { timeout: 10000 })
    .then(r => r.json())
    .then((responseData) => {
      if (get(responseData, 'items.length') > 0) {
        const image = sample(filter(responseData.items, filterMimeTypes))
        const imageUrl = image.link
        const tbUrl = image.image.thumbnailLink

        return getImage(imageUrl, tbUrl)
          .then(res => ({ image: res, url: imageUrl }))
          .catch((err) => {
            segments.querySegment.addError(err)
            return Promise.reject(`Can't load image: ${imageUrl}`)
          })
      }

      return Promise.reject(`Google can't find ${query} for you`)
    })
    .catch((e) => {
      segments.querySegment.addError(e)
      return Promise.reject(typeof e === 'string' ? e : 'Error getting search result from google.')
    })
}
