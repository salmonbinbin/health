// 讯飞星火API配置
export default {
  hostUrl: "wss://spark-api.xf-yun.com/v1.1/chat", // Spark Lite版本的API地址
  appid: "d8685489",           // 替换为你的APPID
  apiSecret: "YmYwYTA3YzI0MTM1NDg2NjMwYjg0NWY3",   // 替换为你的APISecret
  apiKey: "cf680ed7e706977e48d3ec2795b0c028",     // 替换为你的APIKey
  domain: "lite",              // Spark Lite的领域设置
  temperature: 0.5,            // 核采样阈值，控制输出的随机性
  maxTokens: 2048              // 最大输出的token个数
} 