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
    records.value = data.records
      .filter(record => record.type === props.type)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(record => ({
        date: record.date,
        value: record.value,
        unit: record.unit,
        remark: record.remark
      }))
  } catch (error) {
    console.error('Failed to fetch records:', error)
    records.value = [] // 确保出错时清空数据
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
        <div class="record-date">{{ record.date }}</div>
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