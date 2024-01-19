import { GoogleGenerativeAI } from '@google/generative-ai'
import { setGlobalDispatcher, ProxyAgent } from "undici"
import config from './config.js'

// 访问google需要设置代理url
setGlobalDispatcher(new ProxyAgent({ uri: 'http://127.0.0.1:7890' }))

const genAI = new GoogleGenerativeAI(config.GEMINI_AI_KEY)

const model = genAI.getGenerativeModel({ model: "gemini-pro"})

export const geminiReply = async (prompt: string) => {
  console.log('Q====>', prompt)
  const { response } = await model.generateContent(prompt)
  const text = response.text()
  // console.log('candidates====>', response.candidates?.[0])
  // console.log('safetyRatings====>', response.promptFeedback?.safetyRatings)
  console.log('A====>', text)
  return text
}

const chat = model.startChat({
  // history: [
  //   {
  //     role: "user",
  //     parts: "你好，我有一些问题想问",
  //   },
  //   {
  //     role: "model",
  //     parts: "很高兴认识你。你想知道些什么?",
  //   },
  // ],
  generationConfig: {
    maxOutputTokens: 1000,
  },
});
export const geminiChat = async (prompt: string) => {
  console.log('Q====>', prompt)
  const { response } = await chat.sendMessage(prompt);
  const text = response.text()
  console.log('A====>', text)
  return text
}

const run = async () => {
  await geminiChat('2+2*2=?')
  // await geminiChat('你跟其他模型比有什么区别？')
  // await geminiChat('还有哪些类似的句子？')
  // await geminiChat('你最推荐去哪里？')
}

run();
