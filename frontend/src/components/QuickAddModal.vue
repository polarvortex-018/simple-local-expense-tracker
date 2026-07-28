<template>
  <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all">
      <!-- Header -->
      <div class="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/10">
        <h3 class="text-base font-bold text-slate-100">
          {{ type === 'account' ? 'Add Custom Account' : 'Add Custom Category' }}
        </h3>
        <button 
          @click="$emit('close')" 
          class="text-slate-400 hover:text-slate-200 transition text-sm font-semibold"
        >
          ✕
        </button>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleSubmit" class="p-5 space-y-4">
        <!-- Error alert -->
        <div v-if="error" class="p-3 bg-rose-950/40 border border-rose-900/50 rounded-xl text-rose-400 text-xs">
          {{ error }}
        </div>

        <!-- Name Input -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</label>
          <input 
            v-model="name"
            type="text" 
            placeholder="e.g. Health & Fitness"
            required
            ref="nameInput"
            class="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-xl text-slate-200 text-sm placeholder-slate-650 focus:outline-none transition"
          />
        </div>

        <!-- Account Type Selection (Only for Accounts) -->
        <div v-if="type === 'account'" class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Type</label>
          <select 
            v-model="accountType"
            class="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-xl text-slate-300 text-sm focus:outline-none transition"
          >
            <option value="Checking">Checking</option>
            <option value="Savings">Savings</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Cash">Cash</option>
            <option value="Wallet">Wallet</option>
          </select>
        </div>

        <!-- Action Footer -->
        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button 
            type="button" 
            @click="$emit('close')"
            class="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-850 rounded-xl transition"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="submitting"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition disabled:opacity-50"
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
