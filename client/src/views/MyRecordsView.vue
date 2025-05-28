<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { healthRecordApi } from '@/utils/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const records = ref([])
const showHistoryDialog = ref(false)
const currentIndicator = ref(null)
const historyRecords = ref([])

const indicatorMap = {
  'heart-rate': { name: '心率', icon: '❤️', unit: 'BPM' },
  'weight': { name: '体重', icon: '⚖️', unit: 'kg' },
  'bmi': { name: 'BMI', icon: '📏', unit: '' },
  'body-fat': { name: '体脂率', icon: '🔄', unit: '%' },
  'calorie': { name: '消耗', icon: '🔥', unit: 'kcal' },
  'sleep': { name: '睡眠时间', icon: '⏰', unit: 'h' },
  'running': { name: '跑步距离', icon: '🏃', unit: 'km' },
  'exercise-heart-rate': { name: '运动心率', icon: '❤️', unit: 'BPM' }
}

const fetchRecords = async () => {
  loading.value = true
  try {
    const response = await healthRecordApi.getList()
    console.log('API响应数据:', response)

    // 检查响应数据结构
    if (!response || !response.data) {
      console.error('API返回数据格式错误:', response)
      ElMessage.error('获取记录失败：数据格式错误')
      records.value = []
      return
    }

    // 确保数据是数组
    const recordsData = Array.isArray(response.data) ? response.data : []
    console.log('处理前的记录数据:', recordsData)

    // 按指标类型分组，只保留每个指标的最新有效记录
    const latestRecords = {}
    
    recordsData.forEach(record => {
      // 跳过无效记录
      if (!record || !record.type || !record.value) {
        console.warn('跳过无效记录:', record)
        return
      }

      // 标准化日期
      const recordDate = record.date || record.createdAt?.split('T')[0]
      if (!recordDate) {
        console.warn('跳过无日期记录:', record)
        return
      }

      try {
        const time = new Date(recordDate)
        if (isNaN(time.getTime())) {
          console.warn('跳过无效日期记录:', record)
          return
        }

        // 构建标准化记录
        const validRecord = {
          id: record.id || Date.now().toString(),
          type: record.type,
          value: Number(record.value),
          unit: record.unit || indicatorMap[record.type]?.unit || '',
          date: recordDate,
          createdAt: record.createdAt || recordDate,
          remark: record.remark || ''
        }

        // 更新最新记录
        if (!latestRecords[validRecord.type] || 
            new Date(validRecord.createdAt) > new Date(latestRecords[validRecord.type].createdAt)) {
          latestRecords[validRecord.type] = validRecord
        }
      } catch (error) {
        console.warn('记录处理错误:', error, record)
      }
    })

    const validRecords = Object.values(latestRecords)
    console.log('处理后的有效记录:', validRecords)

    records.value = validRecords
  } catch (error) {
    console.error('获取记录失败:', error)
    ElMessage.error('获取记录失败：' + (error.message || '未知错误'))
    records.value = []
  } finally {
    loading.value = false
  }
}

const viewHistory = async (type) => {
  try {
    const response = await healthRecordApi.getList()
    console.log('历史记录API响应:', response) // 添加日志

    if (!response || !response.data) {
      console.error('历史记录API返回数据格式错误:', response)
      ElMessage.error('获取历史记录失败：数据格式错误')
      historyRecords.value = []
      return
    }

    const recordsData = Array.isArray(response.data) ? response.data : []

    // 添加日期验证
    const isValidDate = (dateStr) => {
      if (!dateStr) return false
      try {
        const time = new Date(dateStr)
        return !isNaN(time.getTime())
      } catch {
        return false
      }
    }

    const validRecords = recordsData
      .filter(record => 
        record && 
        record.type === type && 
        record.createdAt && 
        isValidDate(record.createdAt)
      )
      .map(record => ({
        id: record.id || Date.now().toString(),
        type: record.type,
        value: record.value,
        unit: record.unit || '',
        createdAt: record.createdAt,
        date: record.date || record.createdAt.split('T')[0],
        remark: record.remark || ''
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    console.log('处理后的有效历史记录:', validRecords) // 添加日志

    if (validRecords.length === 0) {
      console.warn('没有找到有效的历史记录')
    }

    historyRecords.value = validRecords
    currentIndicator.value = indicatorMap[type]
    showHistoryDialog.value = true
  } catch (error) {
    console.error('获取历史记录失败:', error)
    ElMessage.error('获取历史记录失败：' + (error.message || '未知错误'))
    historyRecords.value = []
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const formatRecordDate = (record) => {
  try {
    const time = new Date(record.createdAt)
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

const goBack = () => {
  router.back()
}

onMounted(fetchRecords)
</script>

<template>
  <div class="my-records-view">
    <div class="header">
      <el-button @click="goBack">← 返回</el-button>
      <h2>我的记录</h2>
    </div>

    <el-table
      v-loading="loading"
      :data="records"
      style="width: 100%"
    >
      <el-table-column label="指标" min-width="200">
        <template #default="{ row }">
          <div class="indicator-cell">
            <span class="indicator-icon">{{ indicatorMap[row.type]?.icon }}</span>
            <span class="indicator-name">{{ indicatorMap[row.type]?.name }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="记录值" min-width="150">
        <template #default="{ row }">
          {{ row.value }} {{ row.unit }}
        </template>
      </el-table-column>

      <el-table-column label="时间" min-width="200">
        <template #default="{ row }">
          {{ formatRecordDate(row) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button 
            type="primary" 
            link
            @click="viewHistory(row.type)"
          >
            查看历史
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="showHistoryDialog"
      :title="`${currentIndicator?.name}历史记录`"
      width="60%"
    >
      <el-table :data="historyRecords">
        <el-table-column label="记录值" min-width="150">
          <template #default="{ row }">
            {{ row.value }} {{ row.unit }}
          </template>
        </el-table-column>

        <el-table-column label="时间" min-width="200">
          <template #default="{ row }">
            {{ formatRecordDate(row) }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<style scoped>
.my-records-view {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.indicator-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.indicator-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
}

.indicator-name {
  font-weight: 500;
  color: #333;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #333;
  font-weight: 500;
}

:deep(.el-table__fixed-right-patch) {
  background-color: #f5f7fa;
}

:deep(.el-table-fixed-column--right) {
  background-color: #f5f7fa !important;
}

:deep(.el-table__fixed-right) {
  height: 100% !important;
}

:deep(.el-button--primary.is-link) {
  color: #409eff;
  font-weight: 500;
}

:deep(.el-dialog__header) {
  margin: 0;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

:deep(.el-dialog__body) {
  padding: 24px;
}
</style> 