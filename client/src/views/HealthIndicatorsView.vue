<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const defaultIndicators = [
  { 
    id: 'heart-rate', 
    name: '心率', 
    description: '全天平均心率', 
    icon: '❤️',
    unit: 'BPM',
    target: '60-100'
  },
  { 
    id: 'weight', 
    name: '体重', 
    description: '记录每天体重', 
    icon: '⚖️',
    unit: 'kg',
    target: '50-70'
  },
  { 
    id: 'bmi', 
    name: 'BMI', 
    description: '身体质量指数', 
    icon: '📏',
    unit: '',
    target: '18.5-24.9'
  },
  { 
    id: 'body-fat', 
    name: '体脂率', 
    description: '脂肪占体重比例', 
    icon: '🔄',
    unit: '%',
    target: '15-25'
  },
  { 
    id: 'calorie', 
    name: '消耗', 
    description: '全天消耗能量', 
    icon: '🔥',
    unit: 'kcal',
    target: '2000-2500'
  },
  { 
    id: 'sleep', 
    name: '睡眠时间', 
    description: '记录夜间睡眠质量', 
    icon: '⏰',
    unit: '小时',
    target: '7-9'
  }
]

const customIndicators = ref([
  { 
    id: 'running', 
    name: '跑步距离', 
    description: '记录当天跑步距离', 
    icon: '📏',
    unit: 'km',
    target: '5'
  },
  { 
    id: 'exercise-heart-rate', 
    name: '运动心率', 
    description: '记录运动时心率', 
    icon: '❤️',
    unit: 'BPM',
    target: '120-150'
  }
])

// 从本地存储加载自定义指标
const loadCustomIndicators = () => {
  const savedIndicators = localStorage.getItem('customIndicators')
  if (savedIndicators) {
    customIndicators.value = JSON.parse(savedIndicators)
  }
}

// 保存自定义指标到本地存储
const saveCustomIndicators = () => {
  localStorage.setItem('customIndicators', JSON.stringify(customIndicators.value))
}

const showDialog = ref(false)
const isEditing = ref(false)
const currentIndicator = ref(null)
const showGoalDialog = ref(false)
const goals = ref([])

const newIndicator = ref({
  name: '',
  unit: '',
  target: '',
  description: ''
})

const fetchGoals = async () => {
  try {
    const res = await fetch('/api/goals')
    const data = await res.json()
    // 确保goals是数组
    goals.value = Array.isArray(data) ? data : (data.goals || [])
  } catch (error) {
    console.error('获取目标失败:', error)
    goals.value = [] // 确保goals始终是数组
  }
}

onMounted(() => {
  loadCustomIndicators()
  fetchGoals()
})

const openAddDialog = () => {
  isEditing.value = false
  newIndicator.value = {
    name: '',
    unit: '',
    target: '',
    description: ''
  }
  showDialog.value = true
}

const openEditDialog = (indicator) => {
  isEditing.value = true
  currentIndicator.value = indicator
  newIndicator.value = {
    target: indicator.target
  }
  showDialog.value = true
}

const handleSubmit = async () => {
  try {
    if (isEditing.value) {
      // 更新目标值
      currentIndicator.value.target = newIndicator.value.target
      
      // 保存到本地文件
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: currentIndicator.value.id,
          value: newIndicator.value.target,
          unit: currentIndicator.value.unit
        })
      })

      if (response.ok) {
        alert('修改成功！')
      } else {
        throw new Error('保存失败')
      }
    } else {
      // 添加新指标
      const newId = Date.now().toString()
      const indicator = {
        id: newId,
        name: newIndicator.value.name,
        description: newIndicator.value.description,
        unit: newIndicator.value.unit,
        target: newIndicator.value.target,
        icon: '📊' // 默认图标
      }
      customIndicators.value.push(indicator)
      
      // 保存到本地存储
      saveCustomIndicators()
      
      // 保存目标到服务器
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newId,
          value: newIndicator.value.target,
          unit: newIndicator.value.unit,
          name: newIndicator.value.name
        })
      })
      
      if (!response.ok) {
        throw new Error('保存目标失败')
      }
      
      // 刷新目标列表
      fetchGoals()
    }
    showDialog.value = false
  } catch (error) {
    console.error('保存失败:', error)
    alert('修改失败，请重试')
  }
}

const handleDelete = async (indicator) => {
  const index = customIndicators.value.findIndex(item => item.id === indicator.id)
  if (index !== -1) {
    customIndicators.value.splice(index, 1)
    // 保存到本地存储
    saveCustomIndicators()
    
    // 同时从服务器删除目标数据
    try {
      const response = await fetch(`/api/goals/${indicator.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        console.error('删除目标失败:', await response.text())
      }
      
      // 重新获取目标列表
      fetchGoals()
    } catch (error) {
      console.error('删除目标数据失败:', error)
    }
  }
}

const getIndicatorName = (type) => {
  // 先从默认指标中查找
  const defaultIndicator = defaultIndicators.find(i => i.id === type)
  if (defaultIndicator) return defaultIndicator.name
  
  // 再从自定义指标中查找
  const customIndicator = customIndicators.value.find(i => i.id === type)
  if (customIndicator) return customIndicator.name
  
  // 如果都没找到，判断是否为特殊指标（exercise-heart-rate等）
  if (type === 'exercise-heart-rate') return '运动心率'
  if (type === 'running') return '跑步距离'
  
  // 尝试从goals中查找名称，避免只显示ID
  // 确保goals是数组再调用find方法
  const goal = Array.isArray(goals.value) ? 
    goals.value.find(g => g.type === type) : null
  if (goal && goal.name) return goal.name
  
  // 如果是数字ID，显示"自定义指标"而不是数字
  if (!isNaN(type)) return `自定义指标 #${type.slice(-4)}`
  
  // 无法识别的指标显示类型值
  return type
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
          @click="openEditDialog(indicator)"
        >
          <div class="indicator-icon">{{ indicator.icon }}</div>
          <div class="indicator-info">
            <div class="indicator-name">{{ indicator.name }}</div>
            <div class="indicator-description">{{ indicator.description }}</div>
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
          @click="openEditDialog(indicator)"
        >
          <div class="indicator-icon">{{ indicator.icon }}</div>
          <div class="indicator-info">
            <div class="indicator-name">{{ indicator.name }}</div>
            <div class="indicator-description">{{ indicator.description }}</div>
          </div>
          <div 
            class="delete-button" 
            @click.stop="handleDelete(indicator)"
          >
            ×
          </div>
        </div>
        <div class="indicator-card add-indicator" @click="openAddDialog">
          <div class="add-icon">+</div>
          <div class="add-text">添加自定义指标</div>
        </div>
      </div>
    </div>

    <!-- 弹窗 -->
    <div class="dialog-overlay" v-if="showDialog" @click="showDialog = false">
      <div class="dialog" @click.stop>
        <div class="dialog-content">
          <template v-if="!isEditing">
            <div class="form-group">
              <label>指标名称：</label>
              <input type="text" v-model="newIndicator.name" placeholder="请输入指标名称">
            </div>
            <div class="form-group">
              <label>指标单位：</label>
              <input type="text" v-model="newIndicator.unit" placeholder="请输入指标单位">
            </div>
            <div class="form-group">
              <label>目 标：</label>
              <input type="text" v-model="newIndicator.target" placeholder="请输入目标值">
            </div>
            <div class="form-group">
              <label>介 绍：</label>
              <textarea v-model="newIndicator.description" placeholder="请输入指标介绍"></textarea>
            </div>
          </template>
          <template v-else>
            <div class="form-group">
              <label>目 标：</label>
              <input type="text" v-model="newIndicator.target" placeholder="请输入目标值">
            </div>
          </template>
          <button class="submit-button" @click="handleSubmit">{{ isEditing ? '修改目标' : '添加指标' }}</button>
        </div>
      </div>
    </div>
    <button class="goal-form-btn" @click="showGoalDialog = true">
      <span class="icon">📋</span>
      <span class="text">目标表单</span>
    </button>

    <!-- 目标表单弹窗 -->
    <div v-if="showGoalDialog" class="dialog-overlay">
      <div class="dialog-content goals-dialog">
        <h2 class="dialog-title">健康目标列表</h2>
        <div class="goals-list">
          <div v-for="goal in goals" :key="goal.type" class="goal-item">
            <div class="goal-info">
              <span class="goal-name">{{ getIndicatorName(goal.type) }}</span>
              <span class="goal-value">目标值: {{ goal.value }} {{ goal.unit }}</span>
            </div>
          </div>
        </div>
        
        <button class="close-button" @click="showGoalDialog = false">关闭</button>
      </div>
    </div>
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

.add-indicator {
  border: 2px dashed #ccc;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.7);
}

.add-icon {
  font-size: 24px;
  color: #9370DB;
  margin-bottom: 5px;
}

.add-text {
  font-size: 14px;
  color: #666;
}

.delete-button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #ff4444;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.indicator-card:hover .delete-button {
  opacity: 1;
}

.delete-button:hover {
  background-color: #ff0000;
}

/* 弹窗样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background-color: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: dialog-appear 0.3s ease-out;
  transform: translateY(0);
}

@keyframes dialog-appear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-content {
  padding: 30px;
}

.form-group {
  margin-bottom: 24px;
  position: relative;
}

.form-group label {
  display: block;
  width: 100%;
  text-align: left;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
  font-size: 14px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s;
  background-color: #f9f9f9;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #9370DB;
  box-shadow: 0 0 0 3px rgba(147, 112, 219, 0.2);
  background-color: #fff;
}

.form-group textarea {
  height: 120px;
  resize: vertical;
}

.submit-button {
  display: block;
  width: 100%;
  margin: 30px auto 0;
  padding: 14px;
  background: linear-gradient(90deg, #9370DB 0%, #8A5DC7 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(147, 112, 219, 0.3);
}

.submit-button:hover {
  background: linear-gradient(90deg, #8A5DC7 0%, #7952B3 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(147, 112, 219, 0.4);
}

.goal-form-btn {
  position: fixed;
  right: 40px;
  bottom: 100px;
  z-index: 1001;
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #8A5DC7, #604890);
  color: #fff;
  border: none;
  border-radius: 50px;
  padding: 12px 24px;
  font-size: 18px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(138, 93, 199, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.goal-form-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(138, 93, 199, 0.4);
}

.goal-form-btn .icon {
  font-size: 24px;
}

.dialog-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #666;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.cancel-button {
  padding: 8px 20px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.submit-button {
  padding: 8px 20px;
  background: #9370DB;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.goals-dialog {
  min-width: 400px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.goals-list {
  max-height: 400px;
  overflow-y: auto;
}

.goal-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.goal-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goal-name {
  font-weight: 500;
  color: #333;
}

.goal-value {
  color: #666;
}

.close-button {
  margin-top: 20px;
  width: 100%;
  padding: 10px;
  background: #9370DB;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.close-button:hover {
  background: #8A5DC7;
}
</style> 