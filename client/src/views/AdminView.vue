<template>
  <div class="admin-container">
    <div class="admin-header">
      <h1>系统管理后台</h1>
      <div class="admin-info">
        <span>管理员: {{ currentUser.username }}</span>
        <el-button type="danger" size="small" @click="logout">退出登录</el-button>
      </div>
    </div>

    <div class="admin-content">
      <div class="section">
        <h2>用户管理</h2>
        <el-table
          v-loading="loading"
          :data="users"
          stripe
          style="width: 100%">
          <el-table-column prop="id" label="ID" width="140">
            <template #default="scope">
              <span :title="scope.row.id">{{ scope.row.id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="用户名" width="150" />
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag 
                :type="scope.row.isDisabled ? 'danger' : 'success'"
                effect="plain"
                size="small"
              >
                {{ scope.row.isDisabled ? '已禁用' : '正常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.createdAt || scope.row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240">
            <template #default="scope">
              <el-button 
                type="primary" 
                size="small" 
                @click="viewUserRecords(scope.row)"
              >
                查看记录
              </el-button>
              
              <el-button 
                v-if="!scope.row.isDisabled"
                type="danger" 
                size="small" 
                @click="disableUser(scope.row)"
              >
                禁用
              </el-button>
              
              <el-button 
                v-else
                type="success" 
                size="small" 
                @click="enableUser(scope.row)"
              >
                启用
              </el-button>
              
              <el-button 
                v-if="scope.row.username !== 'admin'"
                type="danger" 
                size="small" 
                @click="deleteUser(scope.row)"
                :disabled="scope.row.username === 'admin'"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="selectedUser" class="section">
        <h2>{{ selectedUser.username }} 的健康记录</h2>
        <el-tabs v-model="activeTab">
          <el-tab-pane label="健康记录" name="health">
            <el-table
              v-loading="recordsLoading"
              :data="healthRecords"
              stripe
              style="width: 100%">
              <el-table-column prop="date" label="日期" width="120" />
              <el-table-column prop="type" label="类型" width="150" />
              <el-table-column prop="value" label="数值" width="100" />
              <el-table-column prop="unit" label="单位" width="80" />
              <el-table-column prop="remark" label="备注" />
              <el-table-column prop="createdAt" label="创建时间" width="180">
                <template #default="scope">
                  {{ formatDate(scope.row.createdAt) }}
                </template>
              </el-table-column>
            </el-table>
            <div v-if="!healthRecords.length" class="empty-data">
              没有健康记录数据
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="体测记录" name="physical">
            <el-table
              v-loading="recordsLoading"
              :data="physicalRecords"
              stripe
              style="width: 100%">
              <el-table-column prop="semester" label="学期" width="120" />
              <el-table-column prop="type" label="项目" width="150" />
              <el-table-column prop="value" label="成绩" width="100" />
              <el-table-column prop="grade" label="等级" width="80" />
              <el-table-column prop="remark" label="备注" />
              <el-table-column prop="createdAt" label="创建时间" width="180">
                <template #default="scope">
                  {{ formatDate(scope.row.createdAt) }}
                </template>
              </el-table-column>
            </el-table>
            <div v-if="!physicalRecords.length" class="empty-data">
              没有体测记录数据
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 禁用用户对话框 -->
    <el-dialog
      v-model="disableDialogVisible"
      title="禁用用户"
      width="400px"
    >
      <p>确认要禁用用户 <strong>{{ selectedUserForAction?.username }}</strong> 吗？</p>
      <el-form>
        <el-form-item label="禁用原因">
          <el-input 
            v-model="disableReason" 
            type="textarea" 
            :rows="3"
            placeholder="请输入禁用原因（可选）"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="disableDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDisableUser" :loading="actionLoading">确认禁用</el-button>
      </template>
    </el-dialog>

    <!-- 启用用户对话框 -->
    <el-dialog
      v-model="enableDialogVisible"
      title="启用用户"
      width="400px"
    >
      <p>确认要启用用户 <strong>{{ selectedUserForAction?.username }}</strong> 吗？</p>
      <template #footer>
        <el-button @click="enableDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEnableUser" :loading="actionLoading">确认启用</el-button>
      </template>
    </el-dialog>
    
    <!-- 删除用户对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="删除用户"
      width="400px"
    >
      <p>确认要删除用户 <strong>{{ selectedUserForAction?.username }}</strong> 吗？</p>
      <p class="warning-text">此操作将永久删除该用户及其所有数据，且无法恢复！</p>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDeleteUser" :loading="actionLoading">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import api, { authApi } from '@/utils/api'

export default {
  name: 'AdminView',
  setup() {
    const router = useRouter()
    const users = ref([])
    const loading = ref(false)
    const selectedUser = ref(null)
    const healthRecords = ref([])
    const physicalRecords = ref([])
    const recordsLoading = ref(false)
    const activeTab = ref('health')
    
    // 禁用/启用用户相关状态
    const disableDialogVisible = ref(false)
    const enableDialogVisible = ref(false)
    const selectedUserForAction = ref(null)
    const disableReason = ref('')
    const actionLoading = ref(false)
    const deleteDialogVisible = ref(false)

    const currentUser = computed(() => {
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}')
      return userInfo
    })

    // 检查是否是管理员
    const checkAdminAccess = () => {
      const user = currentUser.value
      if (!user || user.username !== 'admin') {
        ElMessage.error('您没有管理员权限')
        router.push('/login')
        return false
      }
      return true
    }

    // 加载所有用户
    const loadUsers = async () => {
      if (!checkAdminAccess()) return
      
      loading.value = true
      try {
        // 确保使用带有管理员令牌的请求
        const headers = {
          Authorization: `Bearer ${localStorage.getItem('token') || 'admin-token'}`
        }
        
        const response = await api.get('/admin/users', { headers })
        
        if (response.users && Array.isArray(response.users)) {
          // 处理用户数据，确保isDisabled属性存在
          users.value = response.users.map(user => {
            // 统一不同来源数据的字段名
            return {
              ...user,
              // 确保禁用状态字段存在，并且数据类型一致
              isDisabled: user.isDisabled || user.is_disabled || false,
              disabledReason: user.disabledReason || user.disabled_reason || null
            }
          })
          
          console.log(`加载了 ${users.value.length} 个用户`)
        } else {
          users.value = []
          ElMessage.warning('没有找到任何用户')
        }
      } catch (error) {
        console.error('获取用户列表失败:', error.response?.data || error.message)
        ElMessage.error(error.response?.data?.message || '获取用户列表失败')
        users.value = []
      } finally {
        loading.value = false
      }
    }

    // 查看用户记录
    const viewUserRecords = async (user) => {
      selectedUser.value = user
      recordsLoading.value = true
      
      try {
        // 确保使用带有管理员令牌的请求
        const headers = {
          Authorization: `Bearer ${localStorage.getItem('token') || 'admin-token'}`
        }
        
        // 获取用户健康记录
        const healthResponse = await api.get(`/admin/user-records/${user.id}/health`, { headers })
        healthRecords.value = healthResponse.records || []
        
        // 获取用户体测记录
        const physicalResponse = await api.get(`/admin/user-records/${user.id}/physical`, { headers })
        physicalRecords.value = physicalResponse.records || []
      } catch (error) {
        console.error('获取用户记录失败:', error)
        ElMessage.error(error.response?.data?.message || '获取用户记录失败')
      } finally {
        recordsLoading.value = false
      }
    }
    
    // 打开禁用用户对话框
    const disableUser = (user) => {
      selectedUserForAction.value = { ...user } // 创建副本
      disableReason.value = ''
      disableDialogVisible.value = true
    }
    
    // 确认禁用用户
    const confirmDisableUser = async () => {
      if (!selectedUserForAction.value) return
      
      actionLoading.value = true
      try {
        const headers = {
          Authorization: `Bearer ${localStorage.getItem('token') || 'admin-token'}`
        }
        
        // 确保路径正确且ID为字符串
        const userId = String(selectedUserForAction.value.id)
        console.log(`禁用用户，ID: ${userId}, 原因: ${disableReason.value || '无'}`)
        
        const response = await api.post(
          `/admin/users/${userId}/disable`, 
          { reason: disableReason.value },
          { headers }
        )
        
        if (response.success) {
          ElMessage.success('用户已禁用')
          disableDialogVisible.value = false
          
          // 更新用户列表中的状态
          const userIndex = users.value.findIndex(u => u.id === selectedUserForAction.value.id)
          if (userIndex !== -1) {
            // 处理数据库和文件存储的字段名差异
            if ('is_disabled' in users.value[userIndex]) {
              users.value[userIndex].is_disabled = true
              users.value[userIndex].disabled_reason = disableReason.value
            } else {
              users.value[userIndex].isDisabled = true
              users.value[userIndex].disabledReason = disableReason.value
            }
          }
          
          // 刷新用户列表以获取最新数据
          loadUsers()
        } else {
          ElMessage.error(response.message || '禁用用户失败')
        }
      } catch (error) {
        console.error('禁用用户失败:', error.response?.data || error.message || error)
        ElMessage.error(error.response?.data?.message || '禁用用户失败，请检查网络连接或服务器状态')
      } finally {
        actionLoading.value = false
      }
    }
    
    // 打开启用用户对话框
    const enableUser = (user) => {
      selectedUserForAction.value = { ...user } // 创建副本
      enableDialogVisible.value = true
    }
    
    // 确认启用用户
    const confirmEnableUser = async () => {
      if (!selectedUserForAction.value) return
      
      actionLoading.value = true
      try {
        const headers = {
          Authorization: `Bearer ${localStorage.getItem('token') || 'admin-token'}`
        }
        
        // 确保路径正确且ID为字符串
        const userId = String(selectedUserForAction.value.id)
        console.log(`启用用户，ID: ${userId}`)
        
        const response = await api.post(
          `/admin/users/${userId}/enable`,
          {},
          { headers }
        )
        
        if (response.success) {
          ElMessage.success('用户已启用')
          enableDialogVisible.value = false
          
          // 更新用户列表中的状态
          const userIndex = users.value.findIndex(u => u.id === selectedUserForAction.value.id)
          if (userIndex !== -1) {
            // 处理数据库和文件存储的字段名差异
            if ('is_disabled' in users.value[userIndex]) {
              users.value[userIndex].is_disabled = false
              users.value[userIndex].disabled_reason = null
            } else {
              users.value[userIndex].isDisabled = false
              users.value[userIndex].disabledReason = null
            }
          }
          
          // 刷新用户列表以获取最新数据
          loadUsers()
        } else {
          ElMessage.error(response.message || '启用用户失败')
        }
      } catch (error) {
        console.error('启用用户失败:', error.response?.data || error.message || error)
        ElMessage.error(error.response?.data?.message || '启用用户失败，请检查网络连接或服务器状态')
      } finally {
        actionLoading.value = false
      }
    }

    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '未知'
      const date = new Date(dateString)
      return date.toLocaleString()
    }

    // 退出登录
    const logout = () => {
      authApi.clearAuthInfo()
      localStorage.removeItem('lastUsername')
      router.push('/login')
    }

    // 打开删除用户对话框
    const deleteUser = (user) => {
      selectedUserForAction.value = { ...user }
      deleteDialogVisible.value = true
    }

    // 确认删除用户
    const confirmDeleteUser = async () => {
      if (!selectedUserForAction.value) return
      
      actionLoading.value = true
      try {
        const headers = {
          Authorization: `Bearer ${localStorage.getItem('token') || 'admin-token'}`
        }
        
        // 确保路径正确且ID为字符串
        const userId = String(selectedUserForAction.value.id)
        console.log(`删除用户，ID: ${userId}`)
        
        const response = await api.delete(
          `/admin/users/${userId}`,
          { headers }
        )
        
        if (response.success) {
          ElMessage.success('用户已删除')
          deleteDialogVisible.value = false
          
          // 刷新用户列表以获取最新数据
          loadUsers()
        } else {
          ElMessage.error(response.message || '删除用户失败')
        }
      } catch (error) {
        console.error('删除用户失败:', error.response?.data || error.message || error)
        ElMessage.error(error.response?.data?.message || '删除用户失败，请检查网络连接或服务器状态')
      } finally {
        actionLoading.value = false
      }
    }

    onMounted(() => {
      loadUsers()
    })

    return {
      users,
      loading,
      selectedUser,
      healthRecords,
      physicalRecords,
      recordsLoading,
      activeTab,
      currentUser,
      disableDialogVisible,
      enableDialogVisible,
      selectedUserForAction,
      disableReason,
      actionLoading,
      viewUserRecords,
      disableUser,
      enableUser,
      confirmDisableUser,
      confirmEnableUser,
      formatDate,
      logout,
      deleteDialogVisible,
      deleteUser,
      confirmDeleteUser
    }
  }
}
</script>

<style scoped>
.admin-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eaeaea;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}

.empty-data {
  text-align: center;
  padding: 20px;
  color: #909399;
}

.warning-text {
  color: #F56C6C;
  font-weight: bold;
  margin-top: 10px;
}
</style> 