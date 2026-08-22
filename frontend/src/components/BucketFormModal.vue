<template>
  <div>
    <!-- Main Form Modal -->
    <Transition name="fade-slide">
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0f0f15]/80 backdrop-blur-md pb-16 sm:pb-0"
        @click.self="$emit('close')"
      >
        <div class="relative w-full max-w-md bg-[#14141d] border-t sm:border border-[#29293a] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[78vh] sm:max-h-[85vh] my-0 sm:my-auto">
          
          <!-- Header -->
          <div class="flex justify-between items-center px-4 py-3.5 border-b border-[#29293a] bg-[#14141d] shrink-0">
            <h3 class="text-base font-bold text-[#f1f0f5] tracking-tight">
              {{ form.id ? 'Edit Savings Bucket' : 'Create Savings Bucket' }}
            </h3>
            <button 
              type="button" 
              @click="$emit('close')" 
              class="w-8 h-8 flex items-center justify-center rounded-lg text-[#9e9cae] hover:text-[#f1f0f5] hover:bg-[#191924] transition text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Form Wrapper -->
          <form @submit.prevent="handleSubmit" class="flex flex-col flex-1 overflow-hidden">
            <!-- Body -->
            <div class="p-4 space-y-4 overflow-y-auto flex-1">
              <!-- Bucket Name Input -->
              <div class="space-y-1">
                <label class="block text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider">Bucket Name *</label>
                <input 
                  v-model="form.name"
                  type="text"
                  placeholder="e.g. Emergency Fund, New Laptop, Trip"
                  required
                  class="w-full px-3.5 py-2.5 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs font-semibold focus:outline-none transition"
                />
              </div>

              <!-- Compact Appearance Trigger -->
              <div class="space-y-1">
                <label class="block text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider">Appearance</label>
                <div 
                  @click="showAppearanceModal = true"
                  class="flex items-center justify-between p-3 bg-[#0f0f15] border border-[#29293a] hover:border-[#D4BFFF]/60 rounded-xl cursor-pointer transition min-h-[48px]"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[#191924] border border-[#29293a] flex items-center justify-center shrink-0">
                      <span class="material-symbols-outlined text-xl" :style="{ color: form.color || '#D4BFFF' }">{{ resolveIcon(form.icon, 'savings') }}</span>
                    </div>
                    <div>
                      <p class="text-xs font-bold text-[#f1f0f5]">Icon & Color</p>
                      <p class="text-[10px] text-[#9e9cae] font-mono mt-0.5">{{ resolveIcon(form.icon, 'savings') }} • {{ form.color || '#D4BFFF' }}</p>
                    </div>
                  </div>
                  <span class="text-xs font-bold text-[#D4BFFF] flex items-center gap-1">Customize ›</span>
                </div>
              </div>

              <!-- Archive Checkbox (Only in Edit mode) -->
              <label v-if="form.id" class="flex items-center gap-2.5 p-3 bg-[#0f0f15] border border-[#29293a] rounded-xl text-xs text-[#f1f0f5] cursor-pointer">
                <input 
                  type="checkbox" 
                  v-model="form.is_archived" 
                  class="w-4 h-4 rounded border-[#29293a] text-[#D4BFFF] bg-[#14141d] cursor-pointer"
                />
                <span class="font-semibold">Archive Bucket</span>
              </label>
            </div>

            <!-- Sticky Footer Actions -->
            <div class="px-4 py-3 border-t border-[#29293a] bg-[#14141d] shrink-0 flex items-center justify-end gap-2.5">
              <button 
                type="button" 
                @click="$emit('close')" 
                class="px-4 py-2.5 text-xs font-semibold text-[#9e9cae] hover:text-[#f1f0f5] transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                :disabled="submitting"
                class="px-6 py-2.5 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50 min-h-[40px]"
              >
                {{ submitting ? 'Saving...' : (form.id ? 'Save Changes' : '+ Create Savings Bucket') }}
              </button>
            </div>
          </form>

        </div>
      </div>
    </Transition>

    <!-- Nested Appearance Customizer Sheet -->
    <AppearanceModal 
      :isOpen="showAppearanceModal"
      v-model:icon="form.icon"
      v-model:color="form.color"
      title="Bucket Appearance"
      :entityName="form.name || 'Bucket Preview'"
      @close="showAppearanceModal = false"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { resolveIcon } from '../utils/iconResolver.js';
import AppearanceModal from './AppearanceModal.vue';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  bucket: { type: Object, default: null }
});

const emit = defineEmits(['close', 'save']);

const submitting = ref(false);
const showAppearanceModal = ref(false);

const form = ref({
  id: null,
  name: '',
  icon: 'savings',
  color: '#D4BFFF',
  is_archived: false
});

watch([() => props.isOpen, () => props.bucket], ([open, currentBucket]) => {
  if (open) {
    if (currentBucket) {
      form.value = {
        id: currentBucket.id,
        name: currentBucket.name || '',
        icon: resolveIcon(currentBucket.icon, 'savings'),
        color: currentBucket.color || '#D4BFFF',
        is_archived: Boolean(currentBucket.is_archived)
      };
    } else {
      form.value = {
        id: null,
        name: '',
        icon: 'savings',
        color: '#D4BFFF',
        is_archived: false
      };
    }
  }
}, { immediate: true });

function handleSubmit() {
  if (!form.value.name.trim()) return;
  submitting.value = true;
  try {
    emit('save', {
      id: form.value.id,
      name: form.value.name.trim(),
      icon: form.value.icon,
      color: form.value.color,
      is_archived: form.value.is_archived ? 1 : 0
    });
  } finally {
    submitting.value = false;
  }
}
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
