<template>
  <div class="space-y-1">
    <label v-if="label" class="block text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider">{{ label }}</label>
    
    <!-- Compact Trigger Button -->
    <button
      type="button"
      :disabled="disabled"
      @click="isOpen = true"
      class="w-full flex items-center justify-between p-3 bg-[#0f0f15] border border-[#29293a] hover:border-[#D4BFFF]/60 rounded-xl cursor-pointer transition min-h-[44px] text-left disabled:opacity-50"
    >
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <div class="w-8 h-8 rounded-lg bg-[#191924] border border-[#29293a] flex items-center justify-center shrink-0">
          <span 
            class="material-symbols-outlined text-xl"
            :style="{ color: selectedCategory?.color || '#D4BFFF' }"
          >
            {{ resolveIcon(selectedCategory?.icon, 'category') }}
          </span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold text-[#f1f0f5] truncate">
            {{ selectedCategory ? selectedCategory.name : (placeholder || 'Select Category') }}
          </p>
        </div>
      </div>
      <span class="text-xs font-bold text-[#D4BFFF] flex items-center gap-1 shrink-0 ml-2">Select ›</span>
    </button>

    <!-- Bottom Sheet / Modal Picker -->
    <Transition name="fade-slide">
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0f0f15]/80 backdrop-blur-md pb-16 sm:pb-0"
        @click.self="isOpen = false"
      >
        <div class="relative w-full max-w-md bg-[#14141d] border-t sm:border border-[#29293a] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[78vh] sm:max-h-[85vh]">
          
          <!-- Modal Header -->
          <div class="flex justify-between items-center px-4 py-3 border-b border-[#29293a] bg-[#14141d] shrink-0">
            <h3 class="text-sm font-bold text-[#f1f0f5] tracking-tight">{{ title || 'Select Category' }}</h3>
            <button 
              type="button"
              @click="isOpen = false" 
              class="w-8 h-8 flex items-center justify-center rounded-lg text-[#9e9cae] hover:text-[#f1f0f5] hover:bg-[#191924] transition text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Search Bar -->
          <div class="p-3 border-b border-[#29293a]/60 bg-[#0f0f15] shrink-0">
            <div class="relative">
              <input 
                v-model="searchQuery"
                type="text"
                placeholder="Search categories..."
                class="w-full bg-[#14141d] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl px-3 py-2 text-xs text-[#f1f0f5] placeholder-[#9e9cae] focus:outline-none"
              />
              <span v-if="searchQuery" @click="searchQuery = ''" class="absolute right-3 top-2 text-xs text-[#9e9cae] cursor-pointer hover:text-[#f1f0f5]">✕</span>
            </div>
          </div>

          <!-- Category Options List -->
          <div class="p-3 overflow-y-auto flex-1 space-y-1.5">
            <div v-if="filteredCategories.length === 0" class="py-8 text-center text-xs text-[#9e9cae]">
              No categories found.
            </div>
            
            <button
              v-for="cat in filteredCategories"
              :key="cat.id"
              type="button"
              @click="selectCategory(cat.id)"
              class="w-full flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer"
              :class="modelValue === cat.id 
                ? 'bg-[#D4BFFF]/15 border-[#D4BFFF] ring-1 ring-[#D4BFFF]/40' 
                : 'bg-[#0f0f15] border-[#29293a] hover:border-[#D4BFFF]/40'"
            >
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="w-9 h-9 rounded-xl bg-[#191924] border border-[#29293a] flex items-center justify-center shrink-0">
                  <span 
                    class="material-symbols-outlined text-xl"
                    :style="{ color: cat.color || '#D4BFFF' }"
                  >
                    {{ resolveIcon(cat.icon, 'category') }}
                  </span>
                </div>
                <p class="text-xs font-bold text-[#f1f0f5] truncate">{{ cat.name }}</p>
              </div>

              <span v-if="modelValue === cat.id" class="text-xs font-bold text-[#D4BFFF] shrink-0 ml-2">✓</span>
            </button>
          </div>

          <!-- Modal Footer -->
          <div class="px-4 py-3 bg-[#14141d] border-t border-[#29293a] flex justify-end shrink-0">
            <button
              type="button"
              @click="isOpen = false"
              class="px-5 py-2 text-xs font-semibold text-[#9e9cae] hover:text-[#f1f0f5] transition cursor-pointer"
            >
              Cancel
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { resolveIcon } from '../utils/iconResolver.js';

const props = defineProps({
  categories: { type: Array, required: true },
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: 'Select Category' },
  title: { type: String, default: 'Select Category' },
  disabled: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'change']);

const isOpen = ref(false);
const searchQuery = ref('');

const selectedCategory = computed(() => {
  if (!props.modelValue) return null;
  return props.categories.find(c => c.id === props.modelValue) || null;
});

const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) return props.categories;
  const q = searchQuery.value.toLowerCase().trim();
  return props.categories.filter(c => c.name.toLowerCase().includes(q));
});

function selectCategory(id) {
  emit('update:modelValue', id);
  emit('change', id);
  isOpen.value = false;
  searchQuery.value = '';
}

const open = () => { isOpen.value = true; };
const close = () => { isOpen.value = false; };
defineExpose({ open, close });
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.22s var(--ease-out), transform 0.22s var(--ease-out);
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
