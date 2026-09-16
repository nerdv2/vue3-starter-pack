<script setup lang="ts">
import { computed, useId } from 'vue'

const props = defineProps<{
  label?: string
  error?: string
  hint?: string
  type?: string
  placeholder?: string
  required?: boolean
  autocomplete?: string
}>()

const model = defineModel<string | number>({ default: '' })

const id = useId()
const describedBy = computed(() => {
  if (props.error) {
    return `${id}-error`
  }

  return props.hint ? `${id}-hint` : undefined
})
</script>

<template>
  <div class="field">
    <label v-if="label" class="field__label" :for="id">
      {{ label }}<span v-if="required" aria-hidden="true"> *</span>
    </label>
    <input
      :id="id"
      v-model="model"
      class="field__control"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
    />
    <p v-if="error" :id="`${id}-error`" class="field__error">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-hint`" class="field__hint">{{ hint }}</p>
  </div>
</template>
