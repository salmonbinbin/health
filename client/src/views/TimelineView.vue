<script setup>
import { ref, onMounted, nextTick } from 'vue'
import HealthChart from '../components/HealthChart.vue'
import { useRouter } from 'vue-router'

// 模拟体测成绩数据
const chartData = ref({
  dates: ['大一上', '大一下', '大二上', '大二下'],
  values: [80, 75, 82, 85]
})

const router = useRouter()
const chartReady = ref(false)
const currentAnalysis = ref('')

// 接收子组件传递的AI分析内容
const updateAIAnalysis = (analysis) => {
  currentAnalysis.value = analysis
}

onMounted(async () => {
  // 确保DOM已经渲染完成
  await nextTick()
  // 延迟一点时间确保容器尺寸已计算
  setTimeout(() => {
    chartReady.value = true
  }, 300)
})

const navigateToAddRecord = () => {
  router.push('/add-record')
}
</script>

<template>
  <div class="timeline-view">
    <div class="view-header">
      <h1>体测记录分析</h1>
    </div>

    <div class="content-container">
      <!-- AI体测小助手框 -->
      <div class="feature-box ai-assistant-section">
        <div class="feature-header">
          <h3>AI体测小助手</h3>
        </div>
        <div class="feature-content">
          <div class="ai-assistant-content">
            <i class="feature-icon">🤖</i>
            <p v-if="currentAnalysis">{{ currentAnalysis }}</p>
            <p v-else>您的智能健康顾问，随时为您提供健康建议</p>
          </div>
        </div>
      </div>

      <!-- 健康数据图表 -->
      <div class="feature-box chart-section">
        <div class="feature-header">
          <h3>近两学年体测成绩图表</h3>
        </div>
        <div class="feature-content chart-container" id="health-chart-container">
          <HealthChart 
            v-if="chartReady" 
            :chart-data="chartData" 
            @update-analysis="updateAIAnalysis"
          />
          <div v-else class="chart-loading">加载图表中...</div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button class="action-button add" @click="navigateToAddRecord">添加体测成绩 ></button>
    </div>
  </div>
</template>

<style scoped>
.timeline-view {
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: white;
  border-bottom: 1px solid #eee;
}

.view-header h1 {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.content-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin: 20px;
  gap: 20px;
}

.feature-box {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-assistant-section {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  height: 200px;
}

.chart-section {
  background-color: #f8f8f8;
  height: 350px;
  flex: 1;
}

.feature-header {
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(5px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.feature-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.feature-content {
  flex: 1;
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-container {
  width: 100%;
  height: 100%;
  padding: 0;
}

.chart-loading {
  color: #666;
  font-size: 14px;
}

.ai-assistant-content {
  text-align: center;
  width: 100%;
}

.ai-assistant-content p {
  margin-top: 10px;
  line-height: 1.5;
  font-size: 14px;
}

.feature-icon {
  font-size: 36px;
  margin-bottom: 10px;
  display: block;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin: 0 20px 20px;
}

.action-button {
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  background-color: #9370DB;
  color: white;
  box-shadow: 0 3px 8px rgba(147, 112, 219, 0.3);
}

.action-button.add {
  background-color: #9370DB;
}

.action-button:hover {
  background-color: #8A5DC7;
  transform: translateY(-2px);
  box-shadow: 0 5px 12px rgba(147, 112, 219, 0.5);
}
</style> 