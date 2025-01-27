const { default: axios } = require("axios")
const express = require("express")
require("dotenv").config()
const telegraf = require("telegraf")

const app = express()

const bot = new telegraf.Telegraf(process.env.BOT_TOKEN)

bot.start(async (ctx) => {
    await ctx.reply("hello enter your image name")
})

bot.on("text", async (ctx) => {
    const loading = await ctx.reply("loading")
    try {
        const { data } = await axios.get(process.env.BASE_URL + "/search?query=" + ctx.message.text, {
            headers: {
                Authorization: process.env.API_KEY
            },
        })
        ctx.deleteMessage(loading.message_id)
        const inlineKeyboard = []
        for (let i = 0; i < data.photos.length; i+=2) {
            const row = [
                { text: `${i + 1}`, callback_data: `photo_${data.photos[i]?.id}` },
            ];
            if (data.photos[i + 1]) {
                row.push({ text: `${i + 2}`, callback_data: `photo_${data.photos[i + 1]?.id}` });
            }

            inlineKeyboard.push(row);
        }
        await ctx.reply("result")
        await ctx.reply(data.photos.map((item, index) => `${index + 1}.${item.alt} \nphotographer:${item.photographer}\n\n`), {
            reply_markup: {
                inline_keyboard: inlineKeyboard,
                resize_keyboard: true,
            }
        })
    }
    catch (error) {
        console.error(error)
    }
})

bot.on("callback_query", async (ctx) => {
    const callback_data = ctx.callbackQuery.data
    const [req, id] = callback_data.split("_")
    switch (req) {
        case "photo":
            const {data} = await axios.get(process.env.BASE_URL + "/photos/" + id,{
                headers: {
                    Authorization: process.env.API_KEY
                },
            })
            await ctx.sendPhoto(data.src.original,{
                caption:data.alt
            })
            break;

        default:
            break;
    }
    await ctx.answerCbQuery();
})

const PORT = process.env.PORT || 4299

bot.launch()
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

app.listen(PORT, () => {
    console.log(`app is listening ${PORT}`);
})