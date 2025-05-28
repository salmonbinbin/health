import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHealthRecordsStore = defineStore('healthRecords', () => {
  const records = ref([
    {
      id: 1,
      indicator: '心率',
      value: '75',
      unit: 'BPM',
      time: '2024-01-20 08:30',
      icon: '❤️'
    },
    {
      id: 2,
      indicator: '体重',
      value: '65',
      unit: 'kg',
      time: '2024-01-20 07:15',
      icon: '⚖️'
    },
    {
      id: 3,
      indicator: 'BMI',
      value: '22.5',
      unit: '',
      time: '2024-01-20 07:15',
      icon: '📏'
    },
    {
      id: 4,
      indicator: '体脂率',
      value: '18',
      unit: '%',
      time: '2024-01-20 07:15',
      icon: '🔄'
    },
    {
      id: 5,
      indicator: '消耗',
      value: '2100',
      unit: 'kcal',
      time: '2024-01-20 21:00',
      icon: '🔥'
    },
    {
      id: 6,
      indicator: '睡眠时间',
      value: '7.5',
      unit: '小时',
      time: '2024-01-20 08:00',
      icon: '⏰'
    },
    {
      id: 7,
      indicator: '跑步距离',
      value: '5.2',
      unit: 'km',
      time: '2024-01-19 18:45',
      icon: '📏'
    },
    {
      id: 8,
      indicator: '运动心率',
      value: '145',
      unit: 'BPM',
      time: '2024-01-19 18:30',
      icon: '❤️'
    }
  ])

  const addRecord = (record) => {
    records.value.unshift(record) // 添加到数组开头，让最新记录显示在前面
  }

  return {
    records,
    addRecord
  }
}) 