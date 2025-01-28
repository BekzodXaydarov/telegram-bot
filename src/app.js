const { default: axios } = require("axios")
const express = require("express")
require("dotenv").config()
const telegraf = require("telegraf")

const app = express()

const bot = new telegraf.Telegraf(process.env.BOT_TOKEN)

const progres = new Map()

const rules = {
    photo: `Rasmni nomini kiriting`,
}


bot.start(async (ctx) => {
    await ctx.reply("Salom BKbotga xush kelibsiz siz nima qidirishingizni tanlang \n", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Photo", callback_data: `step_photo` }],
            ],
            resize_keyboard: true
        }
    })
})

bot.command("change", async (ctx) => {
    await ctx.reply('nima qidirishingizni tanlang', {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Photo", callback_data: `step_photo` }],
            ],
            resize_keyboard: true
        }
    })
})

bot.on("text", async (ctx) => {
    const userId = ctx.from.id
    const userData = progres.get(userId)
    switch (userData?.step) {
        case "photo":
            const loading = await ctx.reply("Loading...")
            try {
                const { data } = await axios.get(process.env.BASE_URL + "/v1/search?query=" + ctx.message.text, {
                    headers: {
                        Authorization: process.env.API_KEY
                    },
                })
                await ctx.deleteMessage(loading.message_id)
                const inlineKeyboard = []
                for (let i = 0; i < data.photos.length; i += 4) {
                    const row = [
                        { text: `${i + 1}`, callback_data: `photo_${data.photos[i]?.id}` },
                    ];
                    if (data.photos[i + 1]) {
                        row.push({ text: `${i + 2}`, callback_data: `photo_${data.photos[i + 1]?.id}` });
                    }
                    if (data.photos[i + 2]) {
                        row.push({ text: `${i + 3}`, callback_data: `photo_${data.photos[i + 2]?.id}` });
                    }
                    if (data.photos[i + 3]) {
                        row.push({ text: `${i + 4}`, callback_data: `photo_${data.photos[i + 3]?.id}` });
                    }
                    inlineKeyboard.push(row);
                }
                if (data.photos.length > 0) {
                    await ctx.reply(data.photos.map((item, index) => `${index + 1}.${item?.alt} \nphotographer:${item?.photographer}\n\n`), {
                        reply_markup: {
                            inline_keyboard: [...inlineKeyboard, [{ text: "✖", callback_data: "delete_message" }]],
                            resize_keyboard: true,
                        }
                    })
                } else {
                    await ctx.reply("Hech qanday rasm topilmadi")
                }
            }
            catch (error) {
                console.error(error)
            }
            break;
        default:
            break;
    }

})
bot.action('delete_message', async (ctx) => {
    try {
        await ctx.deleteMessage();
        await ctx.answerCbQuery('Xabar o‘chirildi!');
    } catch (error) {
        console.error('Xatolik yuz berdi:', error);
    }
});
bot.on("callback_query", async (ctx) => {
    const callback_data = ctx.callbackQuery.data
    const userId = ctx.from.id
    // const chatId = ctx.chat.id;
    const [req, id] = callback_data.split("_")
    switch (req) {
        case "step":
            progres.set(userId, { step: id })
            await ctx.reply(rules[id])
            break;
        case "photo":
            const loading = await ctx.reply("Loading...")
            try {
                const { data } = await axios.get(process.env.BASE_URL + "/v1/photos/" + id, {
                    headers: {
                        Authorization: process.env.API_KEY
                    },
                })

                await ctx.sendPhoto(data.src.original, {
                    caption: `title:${data?.alt || "No title"} \n\nphotographer:${data?.photographer || "Unknow"}\n\nphotographer_url:${data?.photographer_url || "No URL available"}`,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "✖", callback_data: "delete_message" }]
                        ]
                    }
                })
            }
            catch (error) {
                await ctx.reply("Error" || error)
                console.error(error)
            }
            await ctx.deleteMessage(loading.message_id)
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