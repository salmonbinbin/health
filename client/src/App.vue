<script setup>
import SideNav from './components/SideNav.vue'
import { ref, shallowRef } from 'vue'

const isDev = import.meta.env.DEV
const StagewiseToolbar = shallowRef(null)
const stagewiseConfig = ref({
  plugins: []
})

// 仅在开发环境中动态导入stagewise工具栏
if (isDev) {
  import('@stagewise/toolbar-vue').then(module => {
    StagewiseToolbar.value = module.StagewiseToolbar
  })
}
</script>

<template>
  <div class="app-container">
    <SideNav />
    <div class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
    <component :is="StagewiseToolbar" v-if="isDev && StagewiseToolbar" :config="stagewiseConfig" />
  </div>
</template>

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    min-height: 100vh;
    font-family: Arial, sans-serif;
    background-color: #9370DB;
}

.app-container {
    display: flex;
    min-height: 100vh;
}

.main-content {
    flex-grow: 1;
    background-color: #f5f5f5;
    border-radius: 30px 0 0 30px;
    overflow: hidden;
    box-shadow: -10px 0 20px rgba(0, 0, 0, 0.15);
    padding: 20px;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>

