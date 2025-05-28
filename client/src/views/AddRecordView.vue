<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { healthRecordApi, physicalTestApi } from '@/utils/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const showDialog = ref(false)
const currentIndicator = ref(null)
const indicatorValue = ref(0)
const remark = ref('')
const selectedSemester = ref('大一（上）')
const latestGrades = ref({})

const semesterOptions = [
  { label: '大一（上）', value: '大一（上）' },
  { label: '大一（下）', value: '大一（下）' },
  { label: '大二（上）', value: '大二（上）' },
  { label: '大二（下）', value: '大二（下）' },
  { label: '大三（上）', value: '大三（上）' },
  { label: '大三（下）', value: '大三（下）' },
  { label: '大四（上）', value: '大四（上）' },
  { label: '大四（下）', value: '大四（下）' }
]

const defaultIndicators = [
  { 
    id: 'bmi', 
    name: '身高体重(BMI)', 
    description: '身体质量指数',
    unit: '',
    icon: '📏',
    defaultValue: 20,
    min: 10,
    max: 50,
    getGrade: (value) => {
      if (value < 18.5) return { text: '不及格', class: 'fail' }
      if (value <= 23.9) return { text: '优秀', class: 'excellent' }
      if (value <= 27.9) return { text: '良好', class: 'good' }
      return { text: '及格', class: 'pass' }
    }
  },
  { 
    id: 'vital-capacity', 
    name: '肺活量(毫升)', 
    description: '最大呼气量',
    unit: 'ml',
    icon: '🫁',
    defaultValue: 3500,
    min: 2000,
    max: 6000,
    getGrade: (value) => {
      if (value < 3000) return { text: '不及格', class: 'fail' }
      if (value >= 4000) return { text: '优秀', class: 'excellent' }
      if (value >= 3500) return { text: '良好', class: 'good' }
      return { text: '及格', class: 'pass' }
    }
  },
  { 
    id: 'sit-and-reach', 
    name: '坐位体前屈(厘米)', 
    description: '柔韧性测试',
    unit: 'cm',
    icon: '🧘',
    defaultValue: 10,
    min: -20,
    max: 30,
    getGrade: (value) => {
      if (value < 0) return { text: '不及格', class: 'fail' }
      if (value >= 20) return { text: '优秀', class: 'excellent' }
      if (value >= 10) return { text: '良好', class: 'good' }
      return { text: '及格', class: 'pass' }
    }
  },
  { 
    id: 'standing-long-jump', 
    name: '立定跳远(厘米)', 
    description: '爆发力测试',
    unit: 'cm',
    icon: '🦘',
    defaultValue: 200,
    min: 100,
    max: 300,
    getGrade: (value) => {
      if (value < 180) return { text: '不及格', class: 'fail' }
      if (value >= 240) return { text: '优秀', class: 'excellent' }
      if (value >= 210) return { text: '良好', class: 'good' }
      return { text: '及格', class: 'pass' }
    }
  },
  { 
    id: 'pull-ups', 
    name: '引体向上(个)', 
    description: '上肢力量',
    unit: '个',
    icon: '💪',
    defaultValue: 5,
    min: 0,
    max: 30,
    getGrade: (value) => {
      if (value < 3) return { text: '不及格', class: 'fail' }
      if (value >= 10) return { text: '优秀', class: 'excellent' }
      if (value >= 6) return { text: '良好', class: 'good' }
      return { text: '及格', class: 'pass' }
    }
  },
  { 
    id: 'fifty-meters', 
    name: '50米跑(秒)', 
    description: '速度测试',
    unit: 's',
    icon: '🏃',
    defaultValue: 8,
    min: 5,
    max: 15,
    getGrade: (value) => {
      if (value > 9) return { text: '不及格', class: 'fail' }
      if (value <= 7) return { text: '优秀', class: 'excellent' }
      if (value <= 8) return { text: '良好', class: 'good' }
      return { text: '及格', class: 'pass' }
    }
  },
  { 
    id: 'thousand-meters', 
    name: '1000米跑(分秒)', 
    description: '耐力测试',
    unit: 's',
    icon: '🏃‍♂️',
    defaultValue: 240,
    min: 180,
    max: 600,
    getGrade: (value) => {
      if (value > 360) return { text: '不及格', class: 'fail' }
      if (value <= 240) return { text: '优秀', class: 'excellent' }
      if (value <= 300) return { text: '良好', class: 'good' }
      return { text: '及格', class: 'pass' }
    }
  }
]

const customIndicators = [
  { 
    id: 'campus-running', 
    name: '校园跑', 
    description: '记录校园跑打卡次数',
    unit: '次',
    icon: '🏃',
    defaultValue: 0,
    min: 0,
    max: 100,
    getGrade: (value) => {
      if (value < 10) return { text: '不及格', class: 'fail' }
      if (value >= 30) return { text: '优秀', class: 'excellent' }
      if (value >= 20) return { text: '良好', class: 'good' }
      return { text: '及格', class: 'pass' }
    }
  },
  { 
    id: 'basketball-layup', 
    name: '三步上篮', 
    description: '篮球体测项目',
    unit: '分',
    icon: '🏀',
    defaultValue: 0,
    min: 0,
    max: 100,
    getGrade: (value) => {
      if (value < 60) return { text: '不及格', class: 'fail' }
      if (value >= 90) return { text: '优秀', class: 'excellent' }
      if (value >= 75) return { text: '良好', class: 'good' }
      return { text: '及格', class: 'pass' }
    }
  }
]

const fetchLatestGrades = async () => {
  try {
    const response = await physicalTestApi.getLatest()
    latestGrades.value = response.data
  } catch (error) {
    console.error('获取最新成绩失败:', error)
  }
}

onMounted(fetchLatestGrades)

const handleAddRecord = (indicator) => {
  currentIndicator.value = indicator
  indicatorValue.value = indicator.defaultValue
  remark.value = ''
  showDialog.value = true
}

const handleSave = async () => {
  loading.value = true
  try {
    const record = {
      semester: selectedSemester.value,
      type: currentIndicator.value.id,
      value: indicatorValue.value,
      unit: currentIndicator.value.unit,
      remark: remark.value || null,
      createdAt: new Date().toISOString(),
      grade: currentIndicator.value.getGrade(indicatorValue.value).text
    }
    
    await physicalTestApi.add(record)
    latestGrades.value[currentIndicator.value.id] = record
    ElMessage.success('添加记录成功')
    showDialog.value = false
  } catch (error) {
    ElMessage.error('添加记录失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="add-record-view">
    <div class="header">
      <el-button @click="goBack">← 返回</el-button>
      <h2>添加体测成绩</h2>
    </div>

    <div class="indicator-section">
      <h3 class="section-title">基本体测成绩</h3>
      <div class="indicators-grid">
        <div 
          v-for="indicator in defaultIndicators" 
          :key="indicator.id"
          class="indicator-card"
        >
          <div class="indicator-content">
            <div class="indicator-icon">{{ indicator.icon }}</div>
            <div class="indicator-info">
              <div class="indicator-name">{{ indicator.name }}</div>
              <div class="indicator-description">{{ indicator.description }}</div>
              <div v-if="indicator.getGrade" class="grade-info" :class="indicator.getGrade(latestGrades[indicator.id]?.value ?? indicator.defaultValue).class">
                {{ indicator.getGrade(latestGrades[indicator.id]?.value ?? indicator.defaultValue).text }}
              </div>
            </div>
          </div>
          <div class="add-button" @click="handleAddRecord(indicator)">
            <el-icon><Plus /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <div class="indicator-section">
      <h3 class="section-title">体育课体测成绩</h3>
      <div class="indicators-grid">
        <div 
          v-for="indicator in customIndicators" 
          :key="indicator.id"
          class="indicator-card"
        >
          <div class="indicator-content">
            <div class="indicator-icon">{{ indicator.icon }}</div>
            <div class="indicator-info">
              <div class="indicator-name">{{ indicator.name }}</div>
              <div class="indicator-description">{{ indicator.description }}</div>
              <div v-if="indicator.getGrade" class="grade-info" :class="indicator.getGrade(latestGrades[indicator.id]?.value ?? indicator.defaultValue).class">
                {{ indicator.getGrade(latestGrades[indicator.id]?.value ?? indicator.defaultValue).text }}
              </div>
            </div>
          </div>
          <div class="add-button" @click="handleAddRecord(indicator)">
            <el-icon><Plus /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="showDialog"
      :title="currentIndicator?.name"
      width="30%"
      center
    >
      <div class="dialog-content">
        <div class="form-item">
          <span>数值：</span>
          <el-input-number 
            v-model="indicatorValue"
            :min="currentIndicator?.min"
            :max="currentIndicator?.max"
            :step="1"
          />
          <span>{{ currentIndicator?.unit }}</span>
        </div>
        
        <div class="form-item">
          <span>学期：</span>
          <el-select v-model="selectedSemester" placeholder="请选择学期">
            <el-option
              v-for="option in semesterOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
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
          <el-button type="primary" @click="handleSave" :loading="loading">
            保存记录
          </el-button>
        </span>
      </template>
    </el-dialog>

    <button class="my-records-button" @click="router.push('/physical-test-records')">
      体测成绩记录 >
    </button>
  </div>
</template>

<style scoped>
.add-record-view {
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.header h2 {
  margin: 0;
}

.indicator-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 16px;
  color: #666;
  padding: 10px;
  margin: 0 0 15px 0;
  background-color: #e0e0e0;
  border-radius: 4px;
}

.indicators-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.indicator-card {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 0;
}

.indicator-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.indicator-icon {
  font-size: 24px;
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
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.indicator-description {
  font-size: 14px;
  color: #666;
}

.grade-info {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  margin-top: 5px;
  display: inline-block;
}

.grade-info.excellent {
  background-color: #67C23A;
  color: white;
}

.grade-info.good {
  background-color: #409EFF;
  color: white;
}

.grade-info.pass {
  background-color: #E6A23C;
  color: white;
}

.grade-info.fail {
  background-color: #F56C6C;
  color: white;
}

.add-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #9370DB;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.add-button:hover {
  background-color: #8a5cd8;
  transform: scale(1.1);
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 0;
}

.form-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.form-item span:first-child {
  width: 60px;
  line-height: 32px;
  text-align: right;
  color: #606266;
}

.form-item :deep(.el-input),
.form-item :deep(.el-date-picker) {
  flex: 1;
}

.form-item :deep(.el-textarea__inner) {
  font-family: inherit;
}

.my-records-button {
  position: fixed;
  bottom: 30px;
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
  z-index: 100;
}

.my-records-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  background-color: #8a5cd8;
}
</style> 