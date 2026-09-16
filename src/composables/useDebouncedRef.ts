import { ref, watch, type Ref } from 'vue'

/**
 * Mirror a source ref after it stops changing for `delay` milliseconds.
 * Used for search inputs so typing does not fire a request per keystroke.
 */
export function useDebouncedRef<T>(source: Ref<T>, delay = 300): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(source, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delay)
  })

  return debounced
}
