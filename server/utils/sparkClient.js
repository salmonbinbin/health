import WebSocket from 'ws'
import CryptoJS from 'crypto-js'
import config from '../config/sparkConfig.js'

class SparkClient {
  constructor() {
    this.appid = config.appid
    this.apiKey = config.apiKey
    this.apiSecret = config.apiSecret
    this.sparkUrl = config.hostUrl
  }

  // 生成鉴权url
  createUrl() {
    const host = this.sparkUrl.replace("wss://", "").replace("ws://", "")
    const date = new Date().toUTCString()
    const algorithm = "hmac-sha256"
    const headers = "host date request-line"
    const signatureOrigin = `host: ${host}\\ndate: ${date}\\nGET /v1.1/chat HTTP/1.1`
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, this.apiSecret)
    const signature = CryptoJS.enc.Base64.stringify(signatureSha)
    const authorization = `api_key="${this.apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`
    
    return `${this.sparkUrl}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${host}`
  }

  // 发送消息到星火API
  async chat(message, healthContext = "") {
    return new Promise((resolve, reject) => {
      try {
        console.log('正在连接星火API...')
        const ws = new WebSocket(this.createUrl())
        let response = ''
        
        ws.on('open', () => {
          console.log('WebSocket连接成功，发送请求...')
          const params = {
            header: {
              app_id: this.appid,
              uid: "health_system_user"
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
                            (healthContext ? `\\n以下是用户的健康数据：${healthContext}` : "") 
                  },
                  { role: "user", content: message }
                ]
              }
            }
          }
          
          ws.send(JSON.stringify(params))
        })

        ws.on('message', (data) => {
          try {
            const result = JSON.parse(data.toString())
            console.log('收到星火API响应:', JSON.stringify(result.header))
            
            if (result.header.code !== 0) {
              ws.close()
              reject(new Error(`调用星火API失败: ${result.header.message || '未知错误'}`))
              return
            }
            
            if (result.payload && result.payload.choices && result.payload.choices.text) {
              const content = result.payload.choices.text[0].content
              console.log('获取到内容片段:', content)
              response += content
            }
            
            if (result.header.status === 2) {
              console.log('星火API响应完成')
              ws.close()
              resolve(response || '抱歉，AI未能生成有效回复')
            }
          } catch (error) {
            console.error('处理响应失败:', error)
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
          if (!response) {
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
}

export default SparkClient 