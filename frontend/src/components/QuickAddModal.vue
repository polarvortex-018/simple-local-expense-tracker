<template>
  <div class="fixed inset-0 z-[60] flex items-start justify-center p-3 sm:p-4 pt-4 sm:pt-12 bg-slate-950/80 backdrop-blur-sm">
    <div class="w-full max-w-md bg-[#131b2e] border border-[#31394d] rounded-2xl shadow-xl overflow-hidden transform transition-all">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-[#31394d] flex justify-between items-center bg-[#0b1326]/60">
        <h3 class="text-sm font-bold text-[#dae2fd] tracking-tight">
          {{ type === 'account' ? 'Add Custom Account' : 'Add Custom Category' }}
        </h3>
        <button 
          @click="$emit('close')" 
          class="text-[#ccc3d8] hover:text-[#dae2fd] transition text-sm font-bold cursor-pointer"
        >
          ✕
        </button>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleSubmit" class="p-4 space-y-3">
        <!-- Error alert -->
        <div v-if="error" class="p-2.5 bg-rose-950/40 border border-rose-900/50 rounded-md text-[#ffb4ab] text-xs">
          {{ error }}
        </div>

        <!-- Name Input -->
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider block">Name</label>
          <input 
            v-model="name"
            type="text" 
            placeholder="e.g. Health & Fitness"
            required
            ref="nameInput"
            class="w-full px-3 py-1.5 bg-[#0b1326] border border-[#31394d] focus:border-[#7c3aed] rounded-md text-[#dae2fd] text-xs placeholder-slate-500 focus:outline-none transition"
          />
        </div>

        <!-- Account Type Selection (Only for Accounts) -->
        <div v-if="type === 'account'" class="space-y-1">
          <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider block">Account Type</label>
          <select 
            v-model="accountType"
            class="w-full px-3 py-1.5 bg-[#0b1326] border border-[#31394d] focus:border-[#7c3aed] rounded-md text-[#dae2fd] text-xs focus:outline-none transition cursor-pointer"
          >
            <option value="Checking">Checking</option>
            <option value="Savings">Savings</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Cash">Cash</option>
            <option value="Wallet">Wallet</option>
          </select>
        </div>

        <!-- Action Footer -->
        <div class="flex justify-end gap-2 pt-3 border-t border-[#31394d]">
          <button 
            type="button" 
            @click="$emit('close')"
            class="px-4 py-1.5 text-xs font-semibold text-[#ccc3d8] hover:text-[#dae2fd] rounded-full transition cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="submitting"
            class="px-6 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-full transition disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {{ submitting ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ['account', 'category'].includes(value)
  }
});

const emit = defineEmits(['close', 'save']);

const name = ref('');
const accountType = ref('Checking');
const submitting = ref(false);
const error = ref('');
const nameInput = ref(null);

onMounted(() => {
  if (nameInput.value) {
    nameInput.value.focus();
  }
});

const handleSubmit = async () => {
  error.value = '';
  
  if (!name.value.trim()) {
    error.value = 'Name cannot be blank.';
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      name: name.value.trim()
    };
    if (props.type === 'account') {
      payload.type = accountType.value;
    }
    emit('save', payload);
  } catch (err) {
    error.value = err.message || 'An error occurred.';
    submitting.value = false;
  }
};
</script>
