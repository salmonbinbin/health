<script setup>
import { ref } from 'vue'

const userProfile = ref({
  username: 'salmon',
  avatar: localStorage.getItem('lastUserAvatar') || '../assets/1.jpg',
  email: 'salmon@example.com',
  gender: '男',
  age: 28,
  height: 175,
  weight: 68
})

const isEditing = ref(false)
const editedProfile = ref({ ...userProfile.value })

const handleEdit = () => {
  isEditing.value = true
  editedProfile.value = { ...userProfile.value }
}

const handleSave = () => {
  userProfile.value = { ...editedProfile.value }
  isEditing.value = false
}

const handleCancel = () => {
  isEditing.value = false
}

const handleAvatarChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      editedProfile.value.avatar = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const handleAvatarClick = () => {
  document.getElementById('avatar-upload').click()
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      userProfile.value.avatar = e.target.result
      localStorage.setItem('lastUserAvatar', e.target.result)
    }
    reader.readAsDataURL(file)
  }
}
</script>

<template>
  <div class="profile-container">
    <div class="profile-header">
      <h1>个人信息</h1>
      <div class="action-buttons" v-if="!isEditing">
        <button class="edit-button" @click="handleEdit">编辑资料</button>
      </div>
      <div class="action-buttons" v-else>
        <button class="save-button" @click="handleSave">保存</button>
        <button class="cancel-button" @click="handleCancel">取消</button>
      </div>
    </div>
    
    <div class="profile-content">
      <div class="avatar-section">
        <div class="avatar-container">
          <img :src="userProfile.avatar" alt="用户头像" class="profile-avatar" @click="handleAvatarClick">
          <input 
            type="file" 
            id="avatar-upload" 
            accept="image/*" 
            style="display: none" 
            @change="handleFileChange"
          >
        </div>
      </div>

      <div class="profile-info">
        <div class="info-group">
          <label>用户名</label>
          <input v-if="isEditing"
                 v-model="editedProfile.username"
                 type="text"
                 class="info-input">
          <span v-else class="info-text">{{ userProfile.username }}</span>
        </div>

        <div class="info-group">
          <label>邮箱</label>
          <input v-if="isEditing"
                 v-model="editedProfile.email"
                 type="email"
                 class="info-input">
          <span v-else class="info-text">{{ userProfile.email }}</span>
        </div>

        <div class="info-group">
          <label>性别</label>
          <select v-if="isEditing"
                  v-model="editedProfile.gender"
                  class="info-input">
            <option value="男">男</option>
            <option value="女">女</option>
            <option value="其他">其他</option>
          </select>
          <span v-else class="info-text">{{ userProfile.gender }}</span>
        </div>

        <div class="info-group">
          <label>年龄</label>
          <input v-if="isEditing"
                 v-model.number="editedProfile.age"
                 type="number"
                 class="info-input">
          <span v-else class="info-text">{{ userProfile.age }}</span>
        </div>

        <div class="info-group">
          <label>身高 (cm)</label>
          <input v-if="isEditing"
                 v-model.number="editedProfile.height"
                 type="number"
                 class="info-input">
          <span v-else class="info-text">{{ userProfile.height }}</span>
        </div>

        <div class="info-group">
          <label>体重 (kg)</label>
          <input v-if="isEditing"
                 v-model.number="editedProfile.weight"
                 type="number"
                 class="info-input">
          <span v-else class="info-text">{{ userProfile.weight }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.profile-header h1 {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.action-buttons button {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-button, .save-button {
  background-color: #9370DB;
  color: white;
  border: none;
}

.cancel-button {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.edit-button:hover, .save-button:hover {
  background-color: #8A5DC7;
}

.cancel-button:hover {
  background-color: #e8e8e8;
}

.profile-content {
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
}

.profile-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #9370DB;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.profile-avatar:hover {
  transform: scale(1.05);
}

.profile-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-group label {
  font-size: 14px;
  color: #666;
}

.info-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  color: #333;
  transition: all 0.3s ease;
}

.info-input:hover {
  border-color: #9370DB;
}

.info-input:focus {
  outline: none;
  border-color: #9370DB;
  box-shadow: 0 0 0 2px rgba(147, 112, 219, 0.2);
}

.info-text {
  font-size: 16px;
  color: #333;
  padding: 8px 0;
}
</style> 