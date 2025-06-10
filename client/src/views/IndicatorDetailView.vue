<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IndicatorChart from '../components/IndicatorChart.vue'

const route = useRoute()
const router = useRouter()
const indicatorId = computed(() => route.params.id)

const records = ref([])
const meta = ref({})
const aiAnalysis = ref('')
const isLoadingAnalysis = ref(false)
const analysisError = ref('')

const indicatorMeta = {
  'heart-rate': { name: '心率', description: '全天平均心率', unit: 'BPM', icon: '❤️' },
  'weight': { name: '体重', description: '记录每天体重', unit: 'kg', icon: '⚖️' },
  'bmi': { name: 'BMI', description: '身体质量指数', unit: '', icon: '📏' },
  'body-fat': { name: '体脂率', description: '脂肪占体重比例', unit: '%', icon: '🔄' },
  'calorie': { name: '消耗', description: '全天消耗能量', unit: 'kcal', icon: '🔥' },
  'sleep': { name: '睡眠时间', description: '记录夜间睡眠质量', unit: 'h', icon: '⏰' },
  'running': { name: '跑步距离', description: '记录当天跑步距离', unit: 'km', icon: '📏' },
  'exercise-heart-rate': { name: '运动心率', description: '记录运动时心率', unit: 'BPM', icon: '❤️' }
}

const fetchRecords = async () => {
  try {
    console.log('详情页获取记录:', indicatorId.value);
    const response = await fetch('http://localhost:3001/api/health-records')
    const { data } = await response.json()
    console.log('详情页获取到原始数据:', data ? data.length : 0, '条记录');
    
    if (Array.isArray(data)) {
      const filteredRecords = data
        .filter(r => r.type === indicatorId.value)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
      console.log(`详情页过滤出${indicatorId.value}类型的记录:`, filteredRecords.length, '条记录');
      
      records.value = filteredRecords
    } else {
      console.warn('详情页接收到非数组格式的数据:', data);
      records.value = []
    }
  } catch (error) {
    console.error('详情页获取记录失败:', error)
    records.value = []
  }
}

const fetchAiAnalysis = async () => {
  isLoadingAnalysis.value = true
  aiAnalysis.value = ''
  analysisError.value = ''
  
  try {
    const username = localStorage.getItem('lastUsername')
    if (!username) {
      isLoadingAnalysis.value = false
      analysisError.value = '请先登录后查看AI分析'
      return
    }
    
    const response = await fetch('http://localhost:3001/api/indicator-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        indicatorId: indicatorId.value,
        username
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      aiAnalysis.value = data.analysis
    } else {
      analysisError.value = data.message || '获取分析失败'
    }
  } catch (error) {
    console.error('AI分析错误:', error)
    analysisError.value = '连接服务器失败，请稍后再试'
  } finally {
    isLoadingAnalysis.value = false
  }
}

onMounted(async () => {
  meta.value = indicatorMeta[indicatorId.value] || {}
  if (!meta.value.name) {
    router.push('/health-record')
    return
  }
  await fetchRecords()
  await fetchAiAnalysis()
  
  // 添加事件监听器，监听记录更新事件
  window.addEventListener('health-record-updated', (event) => {
    console.log('指标详情页接收到记录更新事件', event.detail)
    if (event.detail && event.detail.type === indicatorId.value) {
      console.log('更新的记录类型与当前详情页匹配，刷新数据')
      fetchRecords()
      fetchAiAnalysis()
    }
  })
  
  // 添加详情页直接刷新事件监听器
  window.addEventListener('indicator-detail-refresh', (event) => {
    console.log('接收到详情页刷新事件', event.detail)
    fetchRecords()
    fetchAiAnalysis()
  })
})

onUnmounted(() => {
  // 移除事件监听器
  window.removeEventListener('health-record-updated', fetchRecords)
  window.removeEventListener('indicator-detail-refresh', fetchRecords)
})

watch(() => route.params.id, async () => {
  meta.value = indicatorMeta[indicatorId.value] || {}
  await fetchRecords()
  await fetchAiAnalysis()
})
</script>

<template>
  <div class="indicator-detail-container">
    <div class="detail-header">
      <button class="back-button" @click="router.push('/health-record')">← 返回</button>
      <h1 class="detail-title">
        <span class="indicator-icon">{{ meta.icon }}</span>
        {{ meta.name }}
      </h1>
      <button class="goal-button" @click="router.push('/health-indicators')">
        <span class="goal-icon">🎯</span>
        设置目标
      </button>
    </div>
    
    <div class="chart-section">
      <h2 class="section-title">数据趋势</h2>
      <IndicatorChart :type="indicatorId" mode="simple" />
    </div>

    <div class="ai-analysis-section">
      <h2 class="section-title">
        <span class="ai-icon">🤖</span>
        AI健康分析
      </h2>
      <div class="analysis-content">
        <div v-if="isLoadingAnalysis" class="loading-placeholder">
          <span class="loading-text">AI正在分析中...</span>
          <div class="loading-animation">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
        
        <div v-else-if="analysisError" class="error-message">
          <p>{{ analysisError }}</p>
          <button v-if="!analysisError.includes('请先登录')" class="retry-button" @click="fetchAiAnalysis">重试</button>
          <button v-else class="login-button" @click="router.push('/login')">去登录</button>
        </div>
        
        <div v-else-if="aiAnalysis" class="analysis-result">
          {{ aiAnalysis }}
        </div>
        
        <div v-else class="loading-placeholder">
          <span class="loading-text">AI分析即将接入...</span>
          <p class="feature-desc">该功能将通过讯飞星火AI分析您的健康数据，为您提供个性化的健康建议。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.indicator-detail-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  justify-content: space-between;
}

.back-button {
  background: none;
  border: none;
  color: #9370DB;
  font-size: 16px;
  cursor: pointer;
  padding: 5px 10px;
  margin-right: 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.back-button:hover {
  background-color: rgba(147, 112, 219, 0.1);
}

.detail-title {
  flex: 1;
  font-size: 24px;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
}

.indicator-icon {
  font-size: 24px;
  margin-right: 10px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(147, 112, 219, 0.1);
}

.section-title {
  font-size: 18px;
  color: #666;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.chart-section {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.ai-analysis-section {
  margin-top: 20px;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.ai-icon {
  font-size: 20px;
  margin-right: 8px;
}

.analysis-content {
  background: #f8f8f8;
  border-radius: 6px;
  padding: 20px;
  min-height: 120px;
}

.loading-placeholder {
  text-align: center;
  color: #666;
}

.loading-text {
  font-size: 16px;
  font-weight: 500;
  color: #9370DB;
  margin-bottom: 10px;
  display: block;
}

.feature-desc {
  font-size: 14px;
  color: #888;
  margin-top: 10px;
}

.goal-button {
  background: #9370DB;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  transition: all 0.3s;
}

.goal-button:hover {
  background: #8A5DC7;
  transform: translateY(-1px);
}

.goal-icon {
  font-size: 16px;
}

.loading-animation {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin: 15px 0;
}

.dot {
  width: 10px;
  height: 10px;
  background-color: #9370DB;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  } 
  40% {
    transform: scale(1.0);
  }
}

.error-message {
  color: #e57373;
  text-align: center;
  padding: 10px;
}

.retry-button {
  background: #9370DB;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  font-size: 14px;
}

.login-button {
  background: #1e88e5;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  font-size: 14px;
}

.login-button:hover {
  background: #1976d2;
}

.analysis-result {
  line-height: 1.6;
  color: #333;
  white-space: pre-line;
}
</style> 