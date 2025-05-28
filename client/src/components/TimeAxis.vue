<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  mode: {
    type: String,
    default: 'full', // 'full' 或 'selector'
  },
  selectedRange: {
    type: String,
    default: '5'
  }
})

const emit = defineEmits(['update:selectedRange'])

const timelineData = ref([])
const selectedRange = ref(props.selectedRange)

// 同步外部selectedRange变化
watch(() => props.selectedRange, (newValue) => {
  selectedRange.value = newValue
  if (props.mode === 'full') {
    updateTimelineData()
  }
})

const rangeOptions = [
  { label: '近一学期', value: '1' },
  { label: '近一学年', value: '2' },
  { label: '近两学年', value: '3' }
]

// 从records.json获取并处理数据
const processRecords = (records, days) => {
  // 添加日期格式化函数
  const formatDate = (dateStr) => {
    try {
      const time = new Date(dateStr)
      if (isNaN(time.getTime())) {
        return null
      }
      return dateStr.replace(/-/g, '/')
    } catch (error) {
      console.error('日期格式化错误:', error)
      return null
    }
  }

  // 按日期分组数据
  const groupedByDate = {}
  records.forEach(record => {
    const date = formatDate(record.date)
    if (!date) return // 跳过无效日期
    
    if (!groupedByDate[date]) {
      groupedByDate[date] = {}
    }
    groupedByDate[date][record.type] = {
      value: record.value,
      unit: record.unit
    }
  })

  // 转换为时间轴数据格式
  return Object.entries(groupedByDate)
    .map(([date, data]) => ({
      date,
      data: {
        weight: data.weight || { value: '-', unit: 'kg' },
        calorie: data.calorie || { value: '-', unit: 'kcal' },
        running: data.running || { value: '-', unit: 'km' }
      }
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, days)
}

// 更新时间轴数据
const updateTimelineData = async () => {
  try {
    const response = await fetch('/api/health-records')
    const { data } = await response.json()
    let days = parseInt(selectedRange.value)
    if (selectedRange.value === '3') {
      days = 4
    }
    timelineData.value = processRecords(data, days)
  } catch (error) {
    console.error('Failed to fetch records:', error)
  }
}

// 初始化数据
onMounted(async () => {
  if (props.mode === 'full') {
    await updateTimelineData()
  }
})

// 监听选择器变化并发出事件
watch(selectedRange, (newValue) => {
  emit('update:selectedRange', newValue)
})

const popupStyle = ref({// 弹出框样式
  left: '0px',
  top: '0px',
  display: 'none'
})

const currentData = ref(null)// 当前点击的数据
const isPopupVisible = ref(false)// 是否显示弹出框
const activePointIndex = ref(null)// 当前点击的点的索引
let popupTimer = null// 定时器

// 处理鼠标悬停事件
const handleMouseOver = (event, data, index) => {
  clearTimeout(popupTimer)
  const points = document.getElementsByClassName('timeline_point')
  let left = points[index].offsetLeft

  const isOutsideLeft = left - 100 < 0
  const isOutsideRight = left + 100 > points[points.length - 1].offsetLeft

  let transform_value = 'translateX(-50%)'
  if(isOutsideLeft) {
    left = 0
    transform_value = 'translateX(0%)'
  } else if(isOutsideRight) {
    left = points[points.length - 1].offsetLeft
    transform_value = 'translateX(-90%)'
  }

  popupStyle.value = {
    left: `${left}px`,
    top: '-300px',
    display: 'block',
    zIndex: '1500',
    transform: transform_value,
  }
  
  currentData.value = data
  activePointIndex.value = index
  isPopupVisible.value = true
}

const handleMouseOut = () => {
  popupTimer = setTimeout(() => {
    isPopupVisible.value = false
    currentData.value = null
    activePointIndex.value = null
  }, 100)
}

const handlePopupMouseOver = () => {// 处理弹出框的鼠标悬停事件
  clearTimeout(popupTimer)
  isPopupVisible.value = true
}

const handlePopupMouseOut = () => {// 处理弹出框的鼠标移出事件
  popupTimer = setTimeout(() => {
    isPopupVisible.value = false
    currentData.value = null
    activePointIndex.value = null
  }, 100)
}
</script>

<template>
  <div class="timeline-container">
    <!-- 选择器模式只显示选择器 -->
    <div v-if="mode === 'selector'" class="view-header">
      <el-select v-model="selectedRange" class="date-selector">
        <el-option
          v-for="option in rangeOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
    </div>
    
    <!-- 完整模式显示时间轴 -->
    <div v-if="mode === 'full'" class="timeline">
      <div class="timeline-line"></div>
      <div v-for="(item, index) in timelineData" :key="index" class="timeline_point" :style="{ left: timelineData.length === 1 ? '50%' : `${(index/(timelineData.length-1))*100}%` }"
        @mouseover="(e) => handleMouseOver(e, item, index)"
        @mouseout="handleMouseOut"
      >
        <div class="point" :class="{ active: activePointIndex === index }"></div>
      </div>
      
      <!-- 数据弹出框 -->
      <div 
        class="data-popup" 
        :style="popupStyle" 
        v-if="currentData && isPopupVisible"
        @mouseover="handlePopupMouseOver"
        @mouseout="handlePopupMouseOut"
      >
        <div class="popup-date">{{ currentData.date }}</div>
        <div class="popup-content">
          <div class="popup-item" v-if="currentData.data.weight">
            <div class="item-label">体重</div>
            <div class="item-value">{{ currentData.data.weight.value }}{{ currentData.data.weight.unit }}</div>
          </div>
          
          <div class="popup-item" v-if="currentData.data.calorie">
            <div class="item-label">卡路里</div>
            <div class="item-value">{{ currentData.data.calorie.value }}{{ currentData.data.calorie.unit }}</div>
          </div>
          
          <div class="popup-item" v-if="currentData.data.running">
            <div class="item-label">跑步距离</div>
            <div class="item-value">{{ currentData.data.running.value }}{{ currentData.data.running.unit }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-container {
  position: relative;
  width: 90%;
  padding: 40px 0;
  margin: 0 auto;
}

.timeline {
  position: relative;
  top: 100px;
  height: 4px;
  background: rgba(106, 90, 205, 0.2);
  border-radius: 2px;
}

.timeline-line {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #6A5ACD;
  width: 100%;
  box-shadow: 0 0 8px rgba(106, 90, 205, 0.6);
  border-radius: 2px;
}

.timeline_point {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

.point {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #6A5ACD;
  border: 2px solid #f5f5f5;
  box-shadow: 0 0 8px rgba(106, 90, 205, 0.8);
  transition: all 0.3s ease;
}

.point:hover,
.point.active {
  transform: scale(1.3);
  background: #8A5DC7;
}

.data-popup {
  position: absolute;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  min-width: 200px;
  border: 1px solid rgba(106, 90, 205, 0.2);
}

.popup-date {
  font-size: 14px;
  color: #333;
  font-weight: 600;
  margin-bottom: 10px;
  text-align: center;
  background: #f0f0f0;
  padding: 4px;
  border-radius: 4px;
}

.popup-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.popup-item {
  background: rgba(248, 248, 248, 0.8);
  padding: 8px;
  border-radius: 6px;
  border-left: 3px solid #6A5ACD;
}

.item-label {
  font-size: 12px;
  color: #666;
}

.item-value {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.view-header {
  display: flex;
  justify-content: flex-end;
}

.date-selector {
  width: 120px;
  color: #666;
  font-size: 14px;
}
</style> 