<script setup>
const username = ref(localStorage.getItem('lastUsername'))
</script>

<template>
  <div class="sidebar">
    <div class="profile">
      <div class="avatar">
        <img src="../assets/avatar.png" alt="用户头像">
      </div>
      <h2 class="username" v-if="username">{{ username }}</h2>
    </div>
    // ... rest of the template
  </div>
</template> 