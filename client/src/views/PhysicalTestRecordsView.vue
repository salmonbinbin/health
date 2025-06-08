<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { physicalTestApi } from '@/utils/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const records = ref([])
const loading = ref(false)
const selectedSemester = ref('')
const semesters = [
  '大一（上）', '大一（下）',
  '大二（上）', '大二（下）',
  '大三（上）', '大三（下）',
  '大四（上）', '大四（下）'
]

const fetchRecords = async () => {
  loading.value = true
  try {
    const response = await physicalTestApi.getList()
    const allRecords = response.data.records || []
    if (allRecords.length > 0) {
      const latestSemester = allRecords[0].semester
      selectedSemester.value = latestSemester
      filterRecords()
    }
    records.value = allRecords
  } catch (error) {
    ElMessage.error('获取记录失败')
  } finally {
    loading.value = false
  }
}

const filterRecords = () => {
  if (!selectedSemester.value) return []
  return records.value.filter(record => record.semester === selectedSemester.value)
}

onMounted(fetchRecords)

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="physical-test-records-view">
    <div class="header">
      <el-button @click="goBack">← 返回</el-button>
      <h2>体测成绩记录</h2>
      <el-select v-model="selectedSemester" placeholder="选择学期" class="semester-select">
        <el-option
          v-for="semester in semesters"
          :key="semester"
          :label="semester"
          :value="semester"
        />
      </el-select>
    </div>

    <el-table
      v-loading="loading"
      :data="filterRecords()"
      style="width: 800px; margin: 0 auto"
      stripe
      border
      class="test-table"
    >
      <el-table-column prop="type" label="测试项目" width="200">
        <template #default="{ row }">
          <span class="test-item">{{ row.type === 'bmi' ? '身高体重(BMI)' :
            row.type === 'vital-capacity' ? '肺活量' :
            row.type === 'sit-and-reach' ? '坐位体前屈' :
            row.type === 'standing-long-jump' ? '立定跳远' :
            row.type === 'pull-ups' ? '引体向上' :
            row.type === 'fifty-meters' ? '50米跑' :
            row.type === 'thousand-meters' ? '1000米跑' :
            row.type === 'campus-running' ? '校园跑' :
            row.type === 'basketball-layup' ? '三步上篮' :
            row.type }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="value" label="数值" width="150" align="center" />
      <el-table-column prop="unit" label="单位" width="150" align="center" />
      <el-table-column prop="grade" label="评级" min-width="150" align="center">
        <template #default="{ row }">
          <span :class="['grade-tag', 
            row.grade === '优秀' ? 'excellent' :
            row.grade === '良好' ? 'good' :
            row.grade === '及格' ? 'pass' : 'fail']">
            {{ row.grade }}
          </span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.physical-test-records-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  justify-content: center;
}

.header h2 {
  margin: 0;
  flex: 0 0 auto;
}

.semester-select {
  width: 150px;
  margin-left: auto;
}

.test-table {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.test-item {
  font-weight: 500;
}

.grade-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
}

.grade-tag.excellent {
  background-color: #67C23A;
}

.grade-tag.good {
  background-color: #409EFF;
}

.grade-tag.pass {
  background-color: #E6A23C;
}

.grade-tag.fail {
  background-color: #F56C6C;
}
</style>