<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { healthRecordApi } from '@/utils/api'

const router = useRouter()
const showDialog = ref(false)
const currentIndicator = ref(null)
const recordValue = ref('')
const remark = ref('')
const recordDate = ref(new Date().toISOString().split('T')[0])

const defaultIndicators = [
  { 
    id: 'heart-rate', 
    name: '心率', 
    description: '全天平均心率', 
    icon: '❤️',
    unit: 'BPM'
  },
  { 
    id: 'weight', 
    name: '体重', 
    description: '记录每天体重', 
    icon: '⚖️',
    unit: 'kg'
  },
  { 
    id: 'bmi', 
    name: 'BMI', 
    description: '身体质量指数', 
    icon: '📏',
    unit: ''
  },
  { 
    id: 'body-fat', 
    name: '体脂率', 
    description: '脂肪占体重比例', 
    icon: '🔄',
    unit: '%'
  },
  { 
    id: 'calorie', 
    name: '消耗', 
    description: '全天消耗能量', 
    icon: '🔥',
    unit: 'kcal'
  },
  { 
    id: 'sleep', 
    name: '睡眠时间', 
    description: '记录夜间睡眠质量', 
    icon: '⏰',
    unit: 'h'
  }
]

const customIndicators = [
  { 
    id: 'running', 
    name: '跑步距离', 
    description: '记录当天跑步距离', 
    icon: '📏',
    unit: 'km'
  },
  { 
    id: 'exercise-heart-rate', 
    name: '运动心率', 
    description: '记录运动时心率', 
    icon: '❤️',
    unit: 'BPM'
  }
]

const handleAddRecord = (indicator) => {
  currentIndicator.value = indicator
  recordValue.value = ''
  remark.value = ''
  showDialog.value = true
}

const handleSave = async () => {
  if (!recordValue.value) {
    ElMessage.warning('请输入记录值')
    return
  }

  try {
    const record = {
      type: currentIndicator.value.id,
      value: Number(recordValue.value),
      unit: currentIndicator.value.unit || '',
      remark: remark.value || null,
      date: recordDate.value || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    }

    const response = await healthRecordApi.add(record)
    ElMessage.success('添加成功')
    showDialog.value = false
    
    recordValue.value = ''
    remark.value = ''
    
    const event = new CustomEvent('health-record-updated', { 
      detail: { record, type: record.type }
    });
    window.dispatchEvent(event);
    
    if (router.currentRoute.value.name === 'indicator-detail') {
      console.log('在详情页添加记录，刷新数据');
      if (router.currentRoute.value.params.id === record.type) {
        const detailEvent = new CustomEvent('indicator-detail-refresh', { 
          detail: { indicator: record.type }
        });
        window.dispatchEvent(detailEvent);
      }
    }
  } catch (error) {
    console.error('添加记录失败:', error)
    ElMessage.error('添加失败')
  }
}

const navigateToDetail = (indicatorId) => {
  router.push(`/indicator/${indicatorId}`)
}

const goToMyRecords = () => {
  router.push('/my-records')
}
</script>

<template>
  <div class="health-record-container">
    <div class="indicator-section">
      <h2 class="section-title">默认指标</h2>
      <div class="indicators-grid">
        <div 
          v-for="indicator in defaultIndicators" 
          :key="indicator.id"
          class="indicator-card"
        >
          <div class="indicator-content" @click="navigateToDetail(indicator.id)">
            <div class="indicator-icon">{{ indicator.icon }}</div>
            <div class="indicator-info">
              <div class="indicator-name">{{ indicator.name }}</div>
              <div class="indicator-description">{{ indicator.description }}</div>
            </div>
          </div>
          <div class="add-button" @click.stop="handleAddRecord(indicator)">
            <i class="el-icon-plus">+</i>
          </div>
        </div>
      </div>
    </div>

    <div class="indicator-section">
      <h2 class="section-title">自定义指标</h2>
      <div class="indicators-grid">
        <div 
          v-for="indicator in customIndicators" 
          :key="indicator.id"
          class="indicator-card"
        >
          <div class="indicator-content" @click="navigateToDetail(indicator.id)">
            <div class="indicator-icon">{{ indicator.icon }}</div>
            <div class="indicator-info">
              <div class="indicator-name">{{ indicator.name }}</div>
              <div class="indicator-description">{{ indicator.description }}</div>
            </div>
          </div>
          <div class="add-button" @click.stop="handleAddRecord(indicator)">
            <i class="el-icon-plus">+</i>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加记录弹窗 -->
    <el-dialog
      v-model="showDialog"
      :title="'添加' + (currentIndicator?.name || '') + '记录'"
      width="30%"
    >
      <div class="dialog-content">
        <div class="form-item">
          <span>时间：</span>
          <el-date-picker
            v-model="recordDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </div>
        <div class="form-item">
          <span>记录值：</span>
          <el-input
            v-model="recordValue"
            type="number"
            :placeholder="`请输入${currentIndicator?.name || ''}值`"
          >
            <template #append>{{ currentIndicator?.unit }}</template>
          </el-input>
        </div>
        <div class="form-item">
          <span>备注：</span>
          <el-input
            v-model="remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注（可选）"
          />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSave">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <button class="my-records-button" @click="goToMyRecords">
      我的记录 >
    </button>
  </div>
</template>

<style scoped>
.health-record-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.indicator-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  color: #666;
  padding: 10px;
  margin: 0;
  background-color: #e0e0e0;
  border-radius: 4px;
}

.indicators-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 15px;
}

.indicator-card {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: calc(33.33% - 10px);
  min-width: 250px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.indicator-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.indicator-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.indicator-icon {
  font-size: 24px;
  margin-right: 15px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(147, 112, 219, 0.1);
}

.indicator-info {
  flex: 1;
}

.indicator-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.indicator-description {
  font-size: 14px;
  color: #666;
}

.add-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #9370DB, #8A5DC7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 10px;
  box-shadow: 0 2px 6px rgba(147, 112, 219, 0.4);
  font-size: 20px;
  font-weight: 300;
}

.add-button:hover {
  background: linear-gradient(135deg, #8A5DC7, #7B4EBF);
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 4px 8px rgba(147, 112, 219, 0.6);
}

.dialog-content {
  padding: 20px 0;
}

.form-item {
  margin-bottom: 20px;
}

.form-item span {
  display: block;
  margin-bottom: 8px;
  color: #666;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.my-records-button {
  position: fixed;
  bottom: 80px;
  right: 30px;
  padding: 12px 24px;
  background-color: #9370DB;
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.my-records-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  background-color: #8a5cd8;
}
</style> 