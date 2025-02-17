import '@tg-bot/dynamo-optimization'

import sharp from 'sharp'
import { APIGatewayProxyHandler } from 'aws-lambda'
import { get24hChatStats, sanitizeSvg } from '@tg-bot/common'

import { getDailyUsersBarsSvg } from './src/daily-users-bars.component'

const sharpStatisticsHandler: APIGatewayProxyHandler = async (event) => {
  const chatId = event.queryStringParameters?.chatId || event.pathParameters?.chatId || ''
  const chatData = await get24hChatStats(chatId)
  const html = getDailyUsersBarsSvg(chatData)
  const svg = sanitizeSvg(html)

  const image = await sharp(Buffer.from(svg))
    .resize(1200, 400)
    .flatten({ background: '#fff' })
    .png()
    .toBuffer()

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'image/png' },
    isBase64Encoded: true,
    body: image.toString('base64'),
  }
}

export default sharpStatisticsHandler
