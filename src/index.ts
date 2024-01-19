import { WechatyBuilder, Wechaty } from "wechaty"
import type { WechatyEventListenerMessage, WechatyEventListenerLogin, WechatyEventListenerLogout, WechatyEventListenerScan } from 'wechaty/dist/esm/src/schemas/wechaty-events'
import qrcodeTerminal from "qrcode-terminal"
import { FileBox }  from 'file-box'
import config from './config.js'
import { geminiChat, geminiReply } from './gemini.js'
// import * as PUPPET from "wechaty-puppet";

const startTime = new Date();
const targetUrl = FileBox.fromUrl('https://th.bing.com/th/id/OIP.FjlEnG9SWA-AYpeioEaXYQHaHa?w=196&h=197&c=7&r=0&o=5&dpr=2&pid=1.7')
const onMessage: WechatyEventListenerMessage = async (msg) => {
  // 避免重复发送
  if (msg.date() < startTime) {
    return
  }
  const talker = msg.talker()
  const text = msg.text().trim()
  const room = msg.room()
  /*
  Attachment  = 1,    // Attach(6),
  Audio       = 2,    // Audio(1), Voice(34)
  Contact     = 3,    // ShareCard(42)
  ChatHistory = 4,    // ChatHistory(19)
  Emoticon    = 5,    // Sticker: Emoticon(15), Emoticon(47)
  Image       = 6,    // Img(2), Image(3)
  Text        = 7,    // Text(1)
  Location    = 8,    // Location(48)
  MiniProgram = 9,    // MiniProgram(33)
  GroupNote   = 10,   // GroupNote(53)
  Transfer    = 11,   // Transfers(2000)
  RedEnvelope = 12,   // RedEnvelopes(2001)
  Recalled    = 13,   // Recalled(10002)
  Url         = 14,   // Url(5)
  Video       = 15,   // Video(4), Video(43)
  Post        = 16,   // Moment, Channel, Tweet, etc
  * */
  const type = msg.type()
  console.log('msg.type()===>', type)
  if (msg.self()) {
    return
  }
  if (room) {
    const topic = await room.topic()
    const pattern = RegExp(`^@${msg.to()?.name()}\\s+${config.groupKey}[\\s]*`)

    console.log(`Group name: ${topic} talker: ${talker.name()} content: ${text}`)
    if (!await msg.mentionSelf()) {
      return
    }
    switch (type) {
      case 7:
        if (pattern.test(text)) {
          const groupContent = text.replace(pattern, "")
          const msg = await geminiReply(groupContent)
          await room.say(msg)
        } else {
          console.log("Content is not within the scope of the customization format");
        }
        break
      default:
        console.log(type)
        break
    }
  } else {
    const alias = await (talker.alias() || talker.name())
    console.log(`talker: ${alias} content: ${text}`);
    // 通过私聊发送的消息匹配通过
    // const pass = config.privateKey.some((x) => text.startsWith(x))
    // if (!pass) {
    //   return console.log("Content is not within the scope of the customization format!")
    // }
    switch (type) {
      case 7:
        const msg = await geminiChat(text)
        await talker.say(msg)
        break
      case 6:
        await talker.say(targetUrl)
        break
      default:
        await talker.say('I dont know how to handle this type of message')
        console.log(type)
        break
    }
  }
}

const onScan: WechatyEventListenerScan = (qrcode) => {
  qrcodeTerminal.generate(qrcode, { small: true }) // 在console端显示二维码
  const qrcodeImageUrl = ["https://api.qrserver.com/v1/create-qr-code/?data=", encodeURIComponent(qrcode)].join("")
  console.log(qrcodeImageUrl)
}

const onLogin: WechatyEventListenerLogin = async (user) => {
  console.log(`${user} has logged in. Current time:${new Date()}`)
}

const onLogout: WechatyEventListenerLogout = (user)=>  {
  console.log(`${user} has logged out`)
}

const start = () => {
  const bot = WechatyBuilder.build({
    name: "WechatEveryDay",
    puppet: "wechaty-puppet-wechat", // 如果有token，记得更换对应的puppet
    puppetOptions: { uos: true }
  })

  bot
    .on("scan", onScan)
    .on("login", onLogin)
    .on("logout", onLogout)
    .on("message", onMessage);

  bot
    .start()
    .then(() => console.log("Start to log in wechat..."))
    .catch((e) => console.log("init error: ", e))
}

start()
