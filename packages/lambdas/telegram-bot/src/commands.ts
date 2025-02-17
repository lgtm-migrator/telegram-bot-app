import { Telegraf, Context as ContextMessageUpdate } from 'telegraf'
import { random } from 'lodash'
import axios from 'axios'

import {
  checkCommand,
  getChatName,
  getCommandData,
  isLink,
  getFormattedChatStatistics,
  getUsersList,
} from '@tg-bot/common'

import { translate, searchImage, searchYoutube } from './google'
import {
  huify,
  puntoSwitcher,
  sayThanksForLink,
  shrugyfy,
  throwDice,
  yasnyfy,
  zavovu,
} from './text'
import { searchWiki } from './wiki'
import { getCurrency } from './currency'
import { getPrediction } from './magic8ball'
import { getHoroscope } from './horoscope'
import { getWeather } from './weather'
import { getDailyStatistics } from './daily-statistics'

const commands = (bot: Telegraf<ContextMessageUpdate>): void => {
  bot.hears(isLink, (ctx, next) => {
    if (ctx.message && random(0, 100, true) > 99.7) {
      ctx.reply(sayThanksForLink(), { reply_to_message_id: ctx.message.message_id })
    }
    next?.()
  })

  bot.hears(checkCommand('/g'), async (ctx) => {
    const { text, replyId } = getCommandData(ctx.message)
    try {
      const { image, url } = await searchImage(text)
      return await ctx
        .replyWithPhoto({ source: image }, { reply_to_message_id: replyId })
        .catch(() => Promise.reject(new Error(`Can't load ${url} to telegram`)))
    } catch (e) {
      return ctx.reply(e.message, { reply_to_message_id: replyId })
    }
  })

  bot.hears(checkCommand('/h'), (ctx) => {
    const { text, replyId } = getCommandData(ctx.message)
    const huext = huify(text)
    const result = text === huext ? 'https://www.youtube.com/watch?v=q5bc4nmDNio' : huext
    return ctx.reply(result, { reply_to_message_id: replyId })
  })

  bot.hears(checkCommand('/y'), (ctx) => {
    const { text, replyId } = getCommandData(ctx.message)
    const yasno = yasnyfy(text)
    return ctx.reply(yasno, { reply_to_message_id: replyId })
  })

  bot.hears(checkCommand('/c'), async (ctx) => ctx.reply(await getCurrency()))

  bot.hears(checkCommand('/t'), async (ctx) => {
    const { text, replyId } = getCommandData(ctx.message)
    return ctx.reply(await translate(text), { reply_to_message_id: replyId })
  })

  bot.hears(checkCommand('/ts'), async (ctx) => {
    const { text, replyId } = getCommandData(ctx.message)
    return ctx.reply(await translate(text, 'sv'), { reply_to_message_id: replyId })
  })

  bot.hears(checkCommand('/tp'), async (ctx) => {
    const { text, replyId } = getCommandData(ctx.message)
    return ctx.reply(await translate(text, 'pl'), { reply_to_message_id: replyId })
  })

  bot.hears(checkCommand('/td'), async (ctx) => {
    const { text, replyId } = getCommandData(ctx.message)
    return ctx.reply(await translate(text, 'de'), { reply_to_message_id: replyId })
  })

  bot.hears(checkCommand('/tb'), async (ctx) => {
    const { text, replyId } = getCommandData(ctx.message)
    return ctx.reply(await translate(text, 'be'), { reply_to_message_id: replyId })
  })

  bot.hears(checkCommand('/za'), (ctx) => {
    const { text, replyId } = getCommandData(ctx.message)
    return ctx.reply(zavovu(text), { reply_to_message_id: replyId })
  })

  bot.hears(checkCommand('/z'), async (ctx) =>
    ctx.reply(await getFormattedChatStatistics(ctx?.chat?.id ?? '')),
  )

  bot.hears(checkCommand('/s'), async (ctx) => {
    const { replyId } = getCommandData(ctx.message)
    const chatName = getChatName(ctx?.chat)
    const chatId = ctx?.chat?.id ?? ''

    const { message, image } = await getDailyStatistics(replyId, chatId, chatName)

    if (image) {
      return ctx.replyWithPhoto(
        { source: image, filename: 'stats.png' },
        { reply_to_message_id: replyId, caption: message },
      )
    }

    return ctx.replyWithHTML(
      `${chatName} chat statistics: https://telegram-bot-ui.vercel.app/chat/${chatId}`,
      { reply_to_message_id: replyId },
    )
  })

  bot.hears(checkCommand('/8'), async (ctx) => {
    const { replyId } = getCommandData(ctx.message)
    return ctx.replyWithSticker(getPrediction(), { reply_to_message_id: replyId })
  })

  bot.hears(checkCommand('/v'), async (ctx) => {
    const { text, replyId } = getCommandData(ctx.message)
    return ctx.reply(await searchYoutube(text), { reply_to_message_id: replyId })
  })

  bot.hears(checkCommand('/w'), async (ctx) => {
    const { text } = getCommandData(ctx.message)
    return ctx.reply(await searchWiki(text))
  })

  bot.hears(checkCommand('/dice'), (ctx) => {
    const { text } = getCommandData(ctx.message)
    const diceRoll = parseInt(text, 10)
    if (diceRoll) {
      return ctx.replyWithMarkdown(throwDice(parseInt(text, 10) || 6), {
        reply_to_message_id: ctx.message?.message_id,
      })
    }
    return ctx.replyWithDice()
  })

  bot.hears(checkCommand('/p'), async (ctx) => {
    const { text, replyId } = getCommandData(ctx.message)
    return ctx.replyWithHTML(await getHoroscope(text), { reply_to_message_id: replyId })
  })

  bot.hears(checkCommand('/f'), async (ctx) => {
    const { text } = getCommandData(ctx.message)
    return ctx.replyWithMarkdown(await getWeather(text || 'Минск'), {
      reply_to_message_id: ctx.message?.message_id,
    })
  })

  bot.hears(checkCommand('/all'), async (ctx) => {
    const { text, replyId } = getCommandData(ctx.message)
    return ctx.reply(await getUsersList(ctx.chat?.id ?? '', text), {
      reply_to_message_id: replyId,
    })
  })

  bot.hears(checkCommand('/ps'), (ctx) => {
    const { text, replyId } = getCommandData(ctx.message)
    return ctx.reply(puntoSwitcher(text), { reply_to_message_id: replyId })
  })

  bot.hears(checkCommand('/shrug'), (ctx) => {
    const { replyId } = getCommandData(ctx.message)
    return ctx.replyWithMarkdown(shrugyfy(), { reply_to_message_id: replyId })
  })

  bot.hears(checkCommand('/check'), async (ctx) => {
    const { replyId } = getCommandData(ctx.message)
    const imageResponse = await axios('https://masha-migrationsverket.deno.dev', {
      timeout: 5000,
      responseType: 'arraybuffer',
    })
    const image = Buffer.from(imageResponse.data)
    return ctx.replyWithPhoto(
      { source: image, filename: 'status.png' },
      { reply_to_message_id: replyId },
    )
  })
}

export default commands
