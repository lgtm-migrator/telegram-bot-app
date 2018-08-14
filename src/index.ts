import '../load-config.js'

import { Handler } from 'aws-lambda'
import * as AWSXRay from 'aws-xray-sdk'
import { get } from 'lodash'

export const segment: any = process.env.IS_LOCAL ? new AWSXRay.Segment('') : AWSXRay.getSegment()
export const segments: any = {
  commandSegment: null,
  dbSegment: null,
  querySegment: null,
}

import { processQuery } from './commands/'
import { closeConnection, openConnection, updateStatistic } from './core'

function updateMessageStat(user_info: any, chat_id: any) {
  segments.dbSegment = new AWSXRay.Segment('mongo-record', segment.trace_id, segment.id)
  return openConnection()
    .then(() => updateStatistic(user_info, chat_id))
    .catch((err) => {
      console.log(err) // tslint:disable-line
      segments.dbSegment.addAttribute('user_info', user_info)
      segments.dbSegment.addError(new Error(err))
    })
}

function processRequest(req: any) {
  if (!req || !req.message || !req.message.chat || !req.message.text) {
    return Promise.resolve('not a telegram message')
  }

  const { message: { message_id, from, chat, text, reply_to_message } } = req
  const replyText = get(reply_to_message, 'text', '')
  segments.commandSegment = new AWSXRay.Segment('process-query', segment.trace_id, segment.id)

  return Promise.all([
    processQuery(text, message_id, chat.id, replyText).then(() => {
      segments.querySegment.close()
      segments.commandSegment.close()
    }),
    updateMessageStat(from, chat.id).then(() => segments.dbSegment.close()),
  ])
    .then(closeConnection)
}

export const handler: Handler = async (event: any) => {
  const body = event.body ? JSON.parse(event.body) : event

  try {
    const message = await processRequest(body)
    return {
      body: JSON.stringify({ body, message }),
      statusCode: 200,
    }

  } catch (e) {
    console.log(e) // tslint:disable-line
    segment.addError(e)
    return {
      body: JSON.stringify({ body, message: 'something going wrong :c' }),
      statusCode: 200,
    }
  } finally {
    const { dbSegment, commandSegment } = segments
    if (dbSegment.fault || commandSegment.fault) {
      segment.addFaultFlag()
      segment.addMetadata('body', body)
    }
  }
}
