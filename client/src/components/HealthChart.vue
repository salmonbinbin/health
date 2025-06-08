<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'

const chartContainer = ref(null)
let chart = null
const aiAnalysis = ref('')

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
    default: 'bmi'
  },
  mode: {
    type: String,
    default: 'full' // 'full' 显示按钮列表, 'simple' 只显示图表
  }
})

const emit = defineEmits(['update-analysis'])

// 将selectedIndicator初始值设置为props.type
const selectedIndicator = ref(props.type)
const indicators = [
  { label: 'BMI', value: 'bmi', unit: '', color: '#4CAF50' },
  { label: '肺活量', value: 'vital-capacity', unit: 'ml', color: '#2196F3' },
  { label: '坐位体前屈', value: 'sit-and-reach', unit: 'cm', color: '#FF9800' },
  { label: '立定跳远', value: 'standing-long-jump', unit: 'cm', color: '#009688' },
  { label: '引体向上', value: 'pull-ups', unit: '次', color: '#6A5ACD' },
  { label: '50米跑', value: 'fifty-meters', unit: '秒', color: '#FF4B4B' },
  { label: '1000米跑', value: 'thousand-meters', unit: '秒', color: '#E91E63' }
]

// 存储体测数据
const physicalTestData = ref({})

// 加载体测数据
const loadPhysicalTestData = async () => {
  try {
    const response = await axios.get('/api/physical-test-records')
    if (response.data && response.data.records) {
      // 按类型分组数据
      const groupedData = {}
      response.data.records.forEach(record => {
        if (!groupedData[record.type]) {
          groupedData[record.type] = []
        }
        groupedData[record.type].push(record)
      })
      
      // 对每种类型的数据按学期排序
      Object.keys(groupedData).forEach(type => {
        groupedData[type].sort((a, b) => {
          const semesterOrder = {
            '大一（上）': 1, '大一（下）': 2,
            '大二（上）': 3, '大二（下）': 4,
            '大三（上）': 5, '大三（下）': 6,
            '大四（上）': 7, '大四（下）': 8
          }
          return semesterOrder[a.semester] - semesterOrder[b.semester]
        })
      })
      
      physicalTestData.value = groupedData
      updateChart()
    }
  } catch (error) {
    console.error('Failed to load physical test data:', error)
  }
}

watch(() => props.type, (newType) => {
  selectedIndicator.value = newType
  updateChart()
})

watch(selectedIndicator, () => {
  updateChart()
  getAIAnalysis()
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
  updateChart()
}

const updateChart = async () => {
  if (!chart) return
  
  try {
    const currentIndicator = indicators.find(i => i.value === selectedIndicator.value)
    
    // 使用体测数据或模拟数据
    let dates = ['大一上', '大一下', '大二上', '大二下']
    let values = [0, 0, 0, 0]
    let grades = ['', '', '', '']
    
    // 如果有该指标的体测数据，则使用实际数据
    if (physicalTestData.value[selectedIndicator.value]) {
      const records = physicalTestData.value[selectedIndicator.value]
      dates = records.map(r => r.semester)
      values = records.map(r => r.value)
      grades = records.map(r => r.grade || '')
    }

    chart.setOption({
      title: {
        text: `${currentIndicator.label}变化趋势`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          const dataIndex = params[0].dataIndex
          return `${dates[dataIndex]}<br/>${currentIndicator.label}: ${values[dataIndex]}${currentIndicator.unit}<br/>评级: ${grades[dataIndex] || '无'}`
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
        data: dates,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: currentIndicator.unit ? `${currentIndicator.label}(${currentIndicator.unit})` : currentIndicator.label
      },
      series: [{
        data: values.map((value, index) => {
          return {
            value: value,
            itemStyle: {
              color: getColorByGrade(grades[index])
            }
          }
        }),
        type: 'line',
        smooth: true,
        lineStyle: {
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

// 根据评级获取颜色
const getColorByGrade = (grade) => {
  switch(grade) {
    case '优秀': return '#4CAF50'
    case '良好': return '#2196F3'
    case '及格': return '#FF9800'
    case '不及格': return '#FF4B4B'
    default: return '#6A5ACD'
  }
}

// 获取AI分析
const getAIAnalysis = async () => {
  const currentIndicator = indicators.find(i => i.value === selectedIndicator.value)
  // 模拟AI分析响应
  // 实际项目中应该调用讯飞星火AI API
  aiAnalysis.value = `正在分析${currentIndicator.label}数据...`
  
  try {
    // 模拟API调用延迟
    setTimeout(() => {
      const analysisMap = {
        'bmi': '您的BMI指数处于健康范围，保持良好的饮食习惯和适当运动可以维持健康体重。',
        'vital-capacity': '您的肺活量有提升空间，建议增加有氧运动如慢跑、游泳等，每周至少3次，每次30分钟。',
        'sit-and-reach': '您的柔韧性表现良好，继续保持拉伸训练，可以尝试瑜伽来进一步提高柔韧性。',
        'standing-long-jump': '您的爆发力表现优秀，可以通过深蹲、箱式跳跃等训练进一步提高。',
        'pull-ups': '您的上肢力量需要加强，建议每周进行3-4次力量训练，逐步增加引体向上次数。',
        'fifty-meters': '您的短跑速度表现良好，可以通过间歇训练和起跑练习进一步提高。',
        'thousand-meters': '您的耐力表现需要提高，建议循序渐进增加跑步距离，每周进行2-3次有氧训练。'
      }
      
      aiAnalysis.value = analysisMap[selectedIndicator.value] || '暂无该项目的分析数据'
      emit('update-analysis', aiAnalysis.value)
    }, 500)
  } catch (error) {
    console.error('Failed to get AI analysis:', error)
    aiAnalysis.value = '获取AI分析失败，请稍后再试'
    emit('update-analysis', aiAnalysis.value)
  }
}

onMounted(async () => {
  await nextTick()
  // 加载体测数据
  await loadPhysicalTestData()
  // 延迟初始化以确保DOM已经渲染完成
  setTimeout(() => {
    initChart()
    // 获取初始AI分析
    getAIAnalysis()
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