<script setup lang="ts">
const promo = ref<{ title: string, text: string }>()

onMounted(async () => {
  promo.value = await $fetch('/api/promo')
})
</script>

<template>
  <div v-if="promo" flex="~ col md:row gap2" md:items-center px10 py6 bg-primary:20 border="b base">
    <strong text-lg>{{ promo.title }}</strong>
    <span op80>{{ promo.text }}</span>
  </div>
</template>
