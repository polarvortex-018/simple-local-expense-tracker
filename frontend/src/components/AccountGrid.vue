<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
    <!-- Account cards -->
    <button
      v-for="account in filteredAccounts"
      :key="account.id"
      type="button"
      @click="$emit('update:modelValue', account.id)"
      class="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition cursor-pointer"
      :class="modelValue === account.id
        ? 'bg-[#D4BFFF]/15 border-[#D4BFFF] ring-1 ring-[#D4BFFF]/40'
        : 'bg-[#0f0f15] border-[#29293a] hover:border-[#D4BFFF]/40'"
    >
      <span class="text-base leading-none shrink-0">
        {{ account.type === 'Savings' ? '🏦' : account.type === 'Credit' ? '💳' : '💵' }}
      </span>
      <div class="min-w-0">
        <p class="text-[11px] font-bold text-[#f1f0f5] truncate">{{ account.name }}</p>
        <p class="text-[9px] text-[#9e9cae] truncate mt-0.5">₹{{ formatAmount(account.balance) }}</p>
      </div>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  accounts: { type: Array, required: true },
  modelValue: { type: [String, Number], default: null }
});

const filteredAccounts = computed(() => {
  return props.accounts.filter(a => a.type !== 'Unassigned' && a.id !== 'acc_unassigned_pool');
});

defineEmits(['update:modelValue']);

const formatAmount = (val) => {
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
</script>
