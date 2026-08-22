<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
    <!-- Unassigned option (optional) -->
    <button
      v-if="showUnassigned"
      type="button"
      @click="$emit('update:modelValue', null)"
      class="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition cursor-pointer"
      :class="modelValue === null
        ? 'bg-[#D4BFFF]/15 border-[#D4BFFF] ring-1 ring-[#D4BFFF]/40'
        : 'bg-[#0f0f15] border-[#29293a] hover:border-[#D4BFFF]/40'"
    >
      <span class="material-symbols-outlined text-base leading-none text-[#D4BFFF] shrink-0">savings</span>
      <div class="min-w-0">
        <p class="text-[11px] font-bold text-[#f1f0f5] truncate">Unassigned</p>
        <p class="text-[9px] text-[#9e9cae] truncate mt-0.5">No bucket</p>
      </div>
    </button>

    <!-- Bucket cards -->
    <button
      v-for="bucket in buckets"
      :key="bucket.id"
      type="button"
      @click="$emit('update:modelValue', bucket.id)"
      class="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition cursor-pointer"
      :class="modelValue === bucket.id
        ? 'bg-[#D4BFFF]/15 border-[#D4BFFF] ring-1 ring-[#D4BFFF]/40'
        : 'bg-[#0f0f15] border-[#29293a] hover:border-[#D4BFFF]/40'"
    >
      <span class="material-symbols-outlined text-base leading-none shrink-0" :style="{ color: bucket.color || '#D4BFFF' }">{{ resolveIcon(bucket.icon, 'savings') }}</span>
      <div class="min-w-0">
        <p class="text-[11px] font-bold text-[#f1f0f5] truncate">{{ bucket.name }}</p>
        <p class="text-[9px] text-[#9e9cae] truncate mt-0.5">₹{{ formatAmount(bucket.allocated_balance) }}</p>
      </div>
    </button>
  </div>
</template>

<script setup>
import { resolveIcon } from '../utils/iconResolver.js';

defineProps({
  buckets: { type: Array, required: true },
  modelValue: { type: String, default: null },
  showUnassigned: { type: Boolean, default: false }
});

defineEmits(['update:modelValue']);

const formatAmount = (val) => {
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
</script>
