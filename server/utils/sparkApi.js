import WebSocket from 'ws'
import CryptoJS from 'crypto-js'
import { v4 as uuidv4 } from 'uuid'
import config from '../config/sparkConfig.js'

// 构建鉴权参数
const getAuthUrl = () => {
  const apiKey = config.apiKey
  const apiSecret = config.apiSecret
  const url = config.hostUrl
  const host = url.replace("wss://", "").replace("ws://", "")
  const date = new Date().toUTCString()
  const algorithm = "hmac-sha256"
  const headers = "host date request-line"
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v1.1/chat HTTP/1.1`
  const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret)
  const signature = CryptoJS.enc.Base64.stringify(signatureSha)
  const authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`
  // 使用Buffer替代btoa函数，因为Node.js不原生支持btoa
  const authorization = Buffer.from(authorizationOrigin).toString('base64')
  
  return `${url}?authorization=${authorization}&date=${date}&host=${host}`
}

// 调用讯飞星火大模型API
export const chatWithSparkAPI = (message, username, healthContext = "", callback) => {
  return new Promise((resolve, reject) => {
    try {
      const authUrl = getAuthUrl()
      console.log('正在连接星火API...')
      
      const ws = new WebSocket(authUrl)
      let finalResponse = ''
      
      // 构建请求参数 (适配Spark Lite版本)
      const requestData = {
        header: {
          app_id: config.appid,
          uid: username || "anonymous_user"
        },
        parameter: {
          chat: {
            domain: config.domain,
            temperature: config.temperature,
            max_tokens: config.maxTokens
          }
        },
        payload: {
          message: {
            text: [
              { 
                role: "system", 
                content: "你是一个专业的健康顾问和助手，请根据用户的健康信息和问题，提供专业、有益的健康建议。" + 
                        (healthContext ? `以下是用户的健康数据：${healthContext}` : "") 
              },
              { role: "user", content: message }
            ]
          }
        }
      }
      
      ws.on('open', () => {
        console.log('WebSocket连接成功，发送请求...')
        ws.send(JSON.stringify(requestData))
      })
      
      ws.on('message', (data) => {
        try {
          const response = JSON.parse(data.toString())
          console.log('收到星火API响应:', JSON.stringify(response.header))
          
          // 检查是否有错误
          if (response.header.code !== 0) {
            console.error('星火API错误:', response.header)
            ws.close()
            reject(new Error(`调用星火API失败: ${response.header.message || '未知错误'}`))
            return
          }
          
          // 获取回答内容
          if (response.payload && response.payload.choices && response.payload.choices.text && response.payload.choices.text.length > 0) {
            const content = response.payload.choices.text[0].content
            console.log('获取到内容片段:', content)
            finalResponse += content
            
            // 如果有回调函数，可以实现流式输出
            if (callback && typeof callback === 'function') {
              callback(content)
            }
          } else {
            console.warn('响应格式异常:', response)
          }
          
          // 判断是否结束
          if (response.header.status === 2) {
            console.log('星火API响应完成')
            ws.close()
            resolve(finalResponse || '抱歉，AI未能生成有效回复')
          }
        } catch (error) {
          console.error('处理响应失败:', error, '原始数据:', data.toString().substring(0, 200) + '...')
          ws.close()
          reject(new Error('解析响应失败'))
        }
      })
      
      ws.on('error', (error) => {
        console.error('WebSocket错误:', error)
        reject(new Error('WebSocket连接错误'))
      })
      
      ws.on('close', (code, reason) => {
        console.log(`WebSocket关闭: ${code}, ${reason}`)
        if (!finalResponse) {
          reject(new Error('连接已关闭，未收到完整响应'))
        }
      })
      
      // 超时处理
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          console.warn('请求超时，关闭连接')
          ws.close()
          reject(new Error('请求超时，请稍后再试'))
        }
      }, 30000) // 30秒超时
    } catch (error) {
      console.error('创建WebSocket连接失败:', error)
      reject(error)
    }
  })
}

export default { chatWithSparkAPI } 