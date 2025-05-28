<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'

const chartContainer = ref(null)
let chart = null
const chartData = ref({
  dates: [],
  values: []
})

const props = defineProps({
  chartData: {
    type: Object,
    default: () => ({
      dates: [],
      values: []
    })
  },
  type: {
    type: String,
    default: 'heart-rate'
  },
  mode: {
    type: String,
    default: 'full' // 'full' 显示按钮列表, 'simple' 只显示图表
  }
})

// 将selectedIndicator初始值设置为props.type
const selectedIndicator = ref(props.type)
const indicators = [
  { label: '心率', value: 'heart-rate', unit: 'BPM', color: '#FF4B4B' },
  { label: '体重', value: 'weight', unit: 'kg', color: '#6A5ACD' },
  { label: 'BMI', value: 'bmi', unit: '', color: '#4CAF50' },
  { label: '体脂率', value: 'body-fat', unit: '%', color: '#FF9800' },
  { label: '消耗', value: 'calorie', unit: 'kcal', color: '#E91E63' },
  { label: '睡眠', value: 'sleep', unit: 'h', color: '#2196F3' },
  { label: '跑步距离', value: 'running', unit: 'km', color: '#009688' },
  { label: '运动心率', value: 'exercise-heart-rate', unit: 'BPM', color: '#F44336' }
]

// 从后端获取数据
const fetchRecordData = async () => {
  try {
    const response = await axios.get('/api/health-records')
    if (response.data && Array.isArray(response.data.data)) {
      // 添加日期验证函数
      const isValidDate = (dateStr) => {
        try {
          const time = new Date(dateStr)
          return !isNaN(time.getTime())
        } catch (error) {
          return false
        }
      }

      // 过滤出当前指标的记录，并验证日期
      const filteredRecords = response.data.data
        .filter(record => 
          record.type === selectedIndicator.value && 
          record.date && 
          isValidDate(record.date)
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date))
      
      // 提取日期和值
      chartData.value = {
        dates: filteredRecords.map(record => {
          const date = new Date(record.date)
          return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
        }),
        values: filteredRecords.map(record => record.value)
      }
      
      updateChart()
    }
  } catch (error) {
    console.error('获取记录数据失败:', error)
  }
}

watch(() => props.type, (newType) => {
  selectedIndicator.value = newType
  fetchRecordData()
})

watch(selectedIndicator, () => {
  fetchRecordData()
})

const initChart = () => {
  if (!chartContainer.value) return
  
  // 确保容器已经有尺寸
  if (chartContainer.value.clientWidth === 0 || chartContainer.value.clientHeight === 0) {
    console.warn('Chart container has no dimensions, setting default size')
    chartContainer.value.style.width = '100%'
    chartContainer.value.style.height = '280px'
  }
  
  // 销毁旧图表实例
  if (chart) {
    chart.dispose()
  }
  
  // 创建新图表实例
  chart = echarts.init(chartContainer.value)
  fetchRecordData()
}

const updateChart = async () => {
  if (!chart) return
  
  try {
    // 使用获取到的数据或默认数据
    const dates = chartData.value.dates.length > 0 ? chartData.value.dates : ['2024/1', '2024/2', '2024/3', '2024/4', '2024/5']
    const values = chartData.value.values.length > 0 ? chartData.value.values : [75, 80, 78, 82, 79]
    const currentIndicator = indicators.find(i => i.value === selectedIndicator.value)

    if (!currentIndicator) {
      console.error('Indicator not found:', selectedIndicator.value)
      return
    }

    // 格式化日期，只显示日期部分 (如: '05-01')
    const formattedDates = dates.map(date => {
      if (!date) return '';
      const dateObj = new Date(date);
      return `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    });

    chart.setOption({
      title: {
        text: `${currentIndicator.label}变化趋势`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          const dataIndex = params[0].dataIndex
          return `${dates[dataIndex]}<br/>${currentIndicator.label}: ${values[dataIndex]}${currentIndicator.unit}`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: formattedDates,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: currentIndicator.unit ? `${currentIndicator.label}(${currentIndicator.unit})` : currentIndicator.label
      },
      series: [{
        data: values,
        type: 'line',
        smooth: true,
        lineStyle: {
          color: currentIndicator.color
        },
        itemStyle: {
          color: currentIndicator.color
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `${currentIndicator.color}80` },
            { offset: 1, color: `${currentIndicator.color}10` }
          ])
        }
      }]
    })
  } catch (error) {
    console.error('Failed to render chart:', error)
    // 显示错误消息
    chart.setOption({
      title: {
        text: '数据加载失败',
        left: 'center'
      },
      xAxis: {
        type: 'category',
        data: []
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: [],
        type: 'line'
      }]
    })
  }
}

onMounted(async () => {
  await nextTick()
  // 延迟初始化以确保DOM已经渲染完成
  setTimeout(() => {
    initChart()
    // 添加窗口大小变化监听
    window.addEventListener('resize', () => {
      chart?.resize()
    })
  }, 100)
})
</script>

<template>
  <div class="chart-wrapper">
    <div ref="chartContainer" class="chart-container"></div>
    
    <div v-if="mode === 'full'" class="indicators-list">
      <button 
        v-for="indicator in indicators" 
        :key="indicator.value"
        :class="['indicator-btn', { active: selectedIndicator === indicator.value }]"
        @click="selectedIndicator = indicator.value"
        :style="{ '--indicator-color': indicator.color }"
      >
        {{ indicator.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.chart-container {
  flex: 1;
  min-height: 250px;
  width: 100%;
}

.indicators-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  padding-top: 5px;
}

.indicator-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 20px;
  background: white;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-bottom: 2px solid var(--indicator-color);
}

.indicator-btn:hover {
  background: #f0f0f0;
  color: var(--indicator-color);
}

.indicator-btn.active {
  background: var(--indicator-color);
  color: white;
}
</style> 