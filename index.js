import { Telegraf } from "telegraf";
import { startScheduler } from './scheduler.js';
import { openDb } from './db_management.js';
import 'dotenv/config.js';
import fs from 'fs';

const TOKEN = process.env.TOKEN;
const chatId = process.env.CHAT_ID;

const rawdata = fs.readFileSync('replies.json');
const replies = JSON.parse(rawdata);

const bot = new Telegraf(TOKEN);
let lastMessageId = null;
let lastDate = null;

const checkHealthMessage = async () => {
    const response = await bot.telegram.sendMessage(chatId, 'Daily mental health check. Select the number that represents your mental condition', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '1', callback_data: '1' }, { text: '2', callback_data: '2' }, { text: '3', callback_data: '3' }],
                [{ text: '4', callback_data: '4' }, { text: '5', callback_data: '5' }, { text: '6', callback_data: '6' }],
                [{ text: '7', callback_data: '7' }, { text: '8', callback_data: '8' }, { text: '9', callback_data: '9' }],
            ]
        }
    });
    lastMessageId = response.message_id;
    lastDate = response.date;
}

(async () => {

    const db = await openDb();
    db.exec(`
        CREATE TABLE IF NOT EXISTS records (
            record_id INTEGER PRIMARY KEY,
            value NUMBER NOT NULL,
            date TIMESTAMP NOT NULL
            )`);
    // db.exec('DELETE from records')
    Object.keys(replies).forEach((key) => {
        bot.action(key, async (ctx) => {
            if (lastMessageId === null || lastDate === null) {
                return;
            }
            try {
                await bot.telegram.deleteMessage(chatId, lastMessageId);
            } catch {
                console.log('Error while deleting message');
            }
            const response = await db.get(`SELECT record_id from records WHERE record_id = ${lastMessageId}`);
            if (response !== undefined) {
                ctx.reply('You have already sent your mood evaluation.');
            } else {
                await db.exec(`INSERT INTO records VALUES (${lastMessageId}, ${key}, ${lastDate})`);
                ctx.reply(replies[key]);
            }
        });
    });
    checkHealthMessage();
    startScheduler(checkHealthMessage)

    bot.launch();

})();
