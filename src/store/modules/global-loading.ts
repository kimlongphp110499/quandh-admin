import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useGlobalLoadingStore = defineStore('globalLoading', () => {
  const counter = ref(0)

  function startRequest() {
    counter.value += 1
  }

  function endRequest() {
    if (counter.value > 0)
      counter.value -= 1
  }

  function reset() {
    counter.value = 0
  }

  const isLoading = computed(() => counter.value > 0)

  return {
    counter,
    isLoading,
    startRequest,
    endRequest,
    reset,
  }
})
