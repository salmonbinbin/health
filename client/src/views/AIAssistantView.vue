<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'

const messages = ref([
  {
    type: 'ai',
    content: '你好！我是基于讯飞星火Lite大模型的智能健康管家，有什么我可以帮你的吗？'
  }
])

const inputMessage = ref('')
const messageContainer = ref(null)
const isLoading = ref(false)
const username = ref('')
const userAvatar = ref('')

// 在组件挂载后安全地获取localStorage数据
onMounted(() => {
  try {
    username.value = localStorage.getItem('lastUsername') || ''
    userAvatar.value = localStorage.getItem('lastUserAvatar') || ''
  } catch (error) {
    console.error('无法访问localStorage:', error)
  }
})

const scrollToBottom = async () => {
  await nextTick()
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

watch(messages, () => {
  scrollToBottom()
}, { deep: true })

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return
  
  // 添加用户消息
  messages.value.push({
    type: 'user',
    content: inputMessage.value
  })
  
  const userMessage = inputMessage.value
  inputMessage.value = '' // 清空输入
  
  isLoading.value = true
  
  try {
    // 获取AI回复
    if (!username.value) {
      // 如果在onMounted中未能获取到，再尝试一次
      try {
        username.value = localStorage.getItem('lastUsername') || ''
      } catch (error) {
        console.error('无法访问localStorage:', error)
        throw new Error('用户未登录或无法访问本地存储')
      }
      
      if (!username.value) {
        throw new Error('用户未登录')
      }
    }
    
    const response = await fetch('http://localhost:3001/api/spark-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userMessage,
        username: username.value
      })
    })
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || '获取回复失败')
    }
    
    // 添加AI回复
    messages.value.push({
      type: 'ai',
      content: data.reply
    })
  } catch (error) {
    console.error('AI回复错误:', error)
  
    // 添加错误提示
    messages.value.push({
      type: 'ai',
      content: `很抱歉，出现了错误: ${error.message || '未知错误'}`
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">智能健康管家</h1>
    <div class="chat-container">
      <div class="chat-messages" ref="messageContainer">
        <div
          v-for="(message, index) in messages"
          :key="index"
          :class="['message', message.type]"
        >
          <div class="avatar">
            <img 
              :src="message.type === 'ai' ? 'https://api.dicebear.com/7.x/bottts/svg?seed=health-assistant' : (userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user')" 
              :alt="message.type === 'ai' ? 'AI头像' : '用户头像'"
            >
          </div>
          <div class="content">{{ message.content }}</div>
        </div>
        <div v-if="isLoading" class="message ai loading">
          <div class="avatar">
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=health-assistant" alt="AI头像">
          </div>
          <div class="content">思考中...</div>
        </div>
      </div>
      
      <div class="input-area">
        <input
          v-model="inputMessage"
          type="text"
          placeholder="输入你的问题..."
          @keyup.enter="sendMessage"
          :disabled="isLoading"
        >
        <button @click="sendMessage" :disabled="isLoading">{{ isLoading ? '处理中' : '发送' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  padding: 30px;
  height: 100vh;
  background: linear-gradient(135deg, #e0f7fa 0%, #f5f7fa 100%);
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 28px;
  color: #1e88e5;
  margin-bottom: 25px;
  font-weight: 600;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.chat-container {
  height: calc(100vh - 150px);
  max-width: 950px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  padding: 25px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(30, 136, 229, 0.1);
  backdrop-filter: blur(5px);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 25px 15px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  scrollbar-width: thin;
  scrollbar-color: rgba(30, 136, 229, 0.3) transparent;
}

.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background-color: rgba(30, 136, 229, 0.3);
  border-radius: 8px;
}

.message {
  display: flex;
  gap: 15px;
  max-width: 75%;
  animation: fadeIn 0.3s ease-out;
}

.message.user {
  flex-direction: row-reverse;
  align-self: flex-end;
}

.avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content {
  padding: 14px 20px;
  border-radius: 14px;
  background: white;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
  line-height: 1.6;
  font-size: 15px;
  position: relative;
}

.message.ai .content {
  background: #e3f2fd;
  border: 1px solid rgba(30, 136, 229, 0.15);
}

.message.user .content {
  background: #4caf50;
  color: white;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.message.ai .content::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 15px;
  border-width: 6px;
  border-style: solid;
  border-color: transparent #e3f2fd transparent transparent;
}

.message.user .content::before {
  content: '';
  position: absolute;
  right: -10px;
  top: 15px;
  border-width: 6px;
  border-style: solid;
  border-color: transparent transparent transparent #4caf50;
}

.message.loading .content {
  color: #888;
  font-style: italic;
  background: #f0f0f0;
  border: none;
}

.message.loading .content::before {
  border-color: transparent #f0f0f0 transparent transparent;
}

.input-area {
  margin-top: 25px;
  display: flex;
  gap: 15px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(30, 136, 229, 0.1);
}

input {
  flex: 1;
  padding: 14px 20px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  outline: none;
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.8);
}

input:focus {
  border-color: #1e88e5;
  box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.2);
}

button {
  padding: 14px 28px;
  background: #1e88e5;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  box-shadow: 0 3px 10px rgba(30, 136, 229, 0.3);
}

button:hover {
  background: #1976d2;
  transform: translateY(-1px);
}

button:active {
  background: #1565c0;
  transform: translateY(1px);
}

button:disabled {
  background: #b0bec5;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>