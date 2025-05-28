<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  type: {
    type: String,
    required: true
  }
})

const records = ref([])

const fetchRecords = async () => {
  try {
    const response = await fetch('/api/health-records')
    const data = await response.json()
    
    if (!data || !data.data) {
      console.error('API返回数据格式错误:', data)
      records.value = []
      return
    }

    const recordsData = Array.isArray(data.data) ? data.data : []
    
    records.value = recordsData
      .filter(record => {
        // 验证记录的完整性
        if (!record || !record.type || record.type !== props.type) {
          console.warn('跳过无效记录:', record)
          return false
        }
        
        // 验证日期
        try {
          const time = new Date(record.date || record.createdAt)
          if (isNaN(time.getTime())) {
            console.warn('跳过无效日期记录:', record)
            return false
          }
          return true
        } catch {
          console.warn('日期解析错误:', record)
          return false
        }
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(record => ({
        date: record.date || record.createdAt.split('T')[0],
        value: record.value,
        unit: record.unit || '',
        remark: record.remark || ''
      }))

    console.log('处理后的历史记录:', records.value)
  } catch (error) {
    console.error('获取记录失败:', error)
    records.value = []
  }
}

const formatDate = (dateStr) => {
  try {
    const time = new Date(dateStr)
    if (isNaN(time.getTime())) {
      return '无效日期'
    }
    const year = time.getFullYear()
    const month = String(time.getMonth() + 1).padStart(2, '0')
    const day = String(time.getDate()).padStart(2, '0')
    const hours = String(time.getHours()).padStart(2, '0')
    const minutes = String(time.getMinutes()).padStart(2, '0')
    
    return `${year}/${month}/${day} ${hours}:${minutes}`
  } catch (error) {
    console.error('日期格式化错误:', error)
    return '无效日期'
  }
}

watch(() => props.type, fetchRecords)

onMounted(fetchRecords)
</script>

<template>
  <div class="records-section">
    <h2>历史记录</h2>
    <div class="records-list">
      <div v-for="record in records" :key="record.date" class="record-item">
        <div class="record-date">{{ formatDate(record.date) }}</div>
        <div class="record-value">{{ record.value }}{{ record.unit }}</div>
        <div class="record-remark">{{ record.remark }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.records-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  margin: 0 0 24px;
  font-size: 20px;
  color: #333;
  font-weight: 500;
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-item {
  padding: 16px;
  border-radius: 8px;
  background: #f8f9fa;
  transition: all 0.3s;
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  align-items: center;
  gap: 16px;
}

.record-item:hover {
  background: #f0f2f5;
  transform: translateX(4px);
}

.record-date {
  font-size: 15px;
  color: #666;
}

.record-value {
  font-size: 18px;
  color: #333;
  font-weight: 500;
}

.record-remark {
  font-size: 15px;
  color: #666;
  text-align: right;
}
</style> 