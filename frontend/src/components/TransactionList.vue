<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-slate-100 tracking-tight">Transactions</h2>
        <p class="text-sm text-slate-400">Search and filter your complete transaction history.</p>
      </div>
      <button 
        @click="$emit('add-transaction')" 
        class="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm rounded-xl transition duration-150 shadow-lg shadow-indigo-600/20 cursor-pointer"
      >
        <span class="text-lg font-bold leading-none">+</span> Add Transaction
      </button>
    </div>

    <!-- Filters Section -->
    <div v-if="showCategoryDropdown" class="fixed inset-0 z-10" @click="showCategoryDropdown = false"></div>

    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <!-- Search Input -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Search</label>
          <input 
            v-model="filters.search"
            @input="debounceFetch"
            type="text" 
            placeholder="Search description/notes..."
            class="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-xl text-slate-200 text-sm placeholder-slate-500 focus:outline-none transition"
          />
        </div>

        <!-- Bucket Filter -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Savings Bucket</label>
          <select 
            v-model="filters.bucket_id" 
            @change="emitFilters"
            class="w-full px-3 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 focus:bg-slate-950 focus:border-indigo-600 rounded-xl text-slate-300 text-xs focus:outline-none transition cursor-pointer"
          >
            <option value="" class="bg-slate-950 text-slate-500">All Buckets</option>
            <option v-for="b in buckets" :key="b.id" :value="b.id" class="bg-slate-950 text-slate-200">
              {{ b.icon || '🪣' }} {{ b.name }}
            </option>
          </select>
        </div>

        <!-- Account Filter -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account</label>
          <select 
            v-model="filters.account_id" 
            @change="emitFilters"
            class="w-full px-3 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 focus:bg-slate-950 focus:border-indigo-600 rounded-xl text-slate-300 text-xs focus:outline-none transition cursor-pointer"
          >
            <option value="" class="bg-slate-950 text-slate-500">All Accounts</option>
            <option v-for="acc in accounts" :key="acc.id" :value="acc.id" class="bg-slate-950 text-slate-200">{{ acc.name }}</option>
          </select>
        </div>

        <!-- Category Filter (Multi-select) -->
        <div class="space-y-1.5 relative z-20">
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categories</label>
          <button 
            type="button"
            @click="showCategoryDropdown = !showCategoryDropdown"
            class="w-full px-3 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 focus:border-indigo-600 rounded-xl text-slate-300 text-xs focus:outline-none transition text-left flex justify-between items-center cursor-pointer"
          >
            <span class="truncate">{{ selectedCategoryNames }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400 transition" :class="{ 'rotate-180': showCategoryDropdown }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div 
            v-if="showCategoryDropdown" 
            class="absolute left-0 right-0 mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl shadow-xl max-h-60 overflow-y-auto space-y-1"
          >
            <label class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-900 cursor-pointer text-xs text-slate-300 transition">
              <input 
                type="checkbox"
                :checked="filters.category_ids.length === 0"
                @change="clearCategorySelection"
                class="rounded border-slate-800 text-indigo-600 focus:ring-indigo-600 bg-slate-900 cursor-pointer"
              />
              <span>All Categories</span>
            </label>
            <hr class="border-slate-800 my-1" />
            <label 
              v-for="cat in categories" 
              :key="cat.id"
              class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-900 cursor-pointer text-xs text-slate-300 transition"
            >
              <input 
                type="checkbox"
                :value="cat.id"
                v-model="filters.category_ids"
                @change="emitFilters"
                class="rounded border-slate-800 text-indigo-600 focus:ring-indigo-600 bg-slate-900 cursor-pointer"
              />
              <span>{{ cat.name }}</span>
            </label>
          </div>
        </div>

        <!-- Type Filter -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</label>
          <select 
            v-model="filters.transaction_type" 
            @change="emitFilters"
            class="w-full px-3 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 focus:bg-slate-950 focus:border-indigo-600 rounded-xl text-slate-300 text-xs focus:outline-none transition cursor-pointer"
          >
            <option value="" class="bg-slate-950 text-slate-500">All Types</option>
            <option value="income" class="bg-slate-950 text-slate-200">Income</option>
            <option value="expense" class="bg-slate-950 text-slate-200">Expense</option>
          </select>
        </div>

        <!-- Date Range Filter -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date Range</label>
          <select 
            v-model="filters.time_range" 
            @change="emitFilters"
            class="w-full px-3 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 focus:bg-slate-950 focus:border-indigo-600 rounded-xl text-slate-300 text-xs focus:outline-none transition cursor-pointer"
          >
            <option value="" class="bg-slate-950 text-slate-500">All Time</option>
            <option value="this_month" class="bg-slate-950 text-slate-200">This Month</option>
            <option value="last_month" class="bg-slate-950 text-slate-200">Last Month</option>
            <option value="last_3_months" class="bg-slate-950 text-slate-200">Last 3 Months</option>
            <option value="last_6_months" class="bg-slate-950 text-slate-200">Last 6 Months</option>
            <option value="this_year" class="bg-slate-950 text-slate-200">This Year</option>
            <option value="custom" class="bg-slate-950 text-slate-200">Custom Range</option>
          </select>
        </div>
      </div>

      <!-- Custom Date Inputs -->
      <div v-if="filters.time_range === 'custom'" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800/60">
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Start Date</label>
          <input 
            v-model="startDateInput"
            @blur="applyCustomDates"
            @change="applyCustomDates"
            @click="$event.target.showPicker?.()"
            type="date"
            class="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-xl text-slate-200 text-sm focus:outline-none transition cursor-pointer [color-scheme:dark]"
          />
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">End Date</label>
          <input 
            v-model="endDateInput"
            @blur="applyCustomDates"
            @change="applyCustomDates"
            @click="$event.target.showPicker?.()"
            type="date"
            class="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-xl text-slate-200 text-sm focus:outline-none transition cursor-pointer [color-scheme:dark]"
          />
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-1">
        <button 
          v-if="hasActiveFilters"
          @click="clearFilters" 
          class="px-3.5 py-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Table Section -->
    <div class="bg-slate-900 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/20">
              <th class="p-4 pl-6">Date</th>
              <th class="p-4">Description</th>
              <th class="p-4">Bucket (Purpose)</th>
              <th class="p-4">Account (Storage)</th>
              <th class="p-4">Category</th>
              <th class="p-4">Type</th>
              <th class="p-4 text-right">Amount</th>
              <th class="p-4 pr-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/50">
            <tr 
              v-for="tx in transactions" 
              :key="tx.id" 
              class="hover:bg-slate-950/10 transition"
            >
              <!-- Date -->
              <td class="p-4 pl-6 text-sm text-slate-300 whitespace-nowrap">
                {{ formatDate(tx.date) }}
              </td>

              <!-- Description & Notes -->
              <td class="p-4 text-sm max-w-xs">
                <p class="font-medium text-slate-200 truncate">{{ tx.description }}</p>
                <p v-if="tx.notes" class="text-xs text-slate-500 truncate mt-0.5">{{ tx.notes }}</p>
              </td>

              <!-- Bucket Badge -->
              <td class="p-4 text-xs whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-900/40">
                  <span>{{ getBucketIcon(tx.bucket_id) }}</span>
                  <span class="font-medium">{{ getBucketName(tx.bucket_id) }}</span>
                </span>
              </td>

              <!-- Account -->
              <td class="p-4 text-sm text-slate-400 whitespace-nowrap">
                {{ getAccountName(tx.account_id) }}
              </td>

              <!-- Category -->
              <td class="p-4 text-sm text-slate-400 whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 text-slate-300 text-xs border border-slate-800">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: getCategoryColor(tx.category_id) }"></span>
                  {{ getCategoryName(tx.category_id) }}
                </span>
              </td>

              <!-- Type -->
              <td class="p-4 whitespace-nowrap">
                <span 
                  class="px-2 py-0.5 rounded-full text-xs font-semibold"
                  :class="tx.transaction_type === 'income' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/30' : 'bg-rose-950/80 text-rose-400 border border-rose-800/30'"
                >
                  {{ tx.transaction_type === 'income' ? 'Income' : 'Expense' }}
                </span>
              </td>

              <!-- Amount -->
              <td 
                class="p-4 text-right text-sm font-semibold whitespace-nowrap"
                :class="tx.transaction_type === 'income' ? 'text-emerald-400' : 'text-slate-200'"
              >
                {{ tx.transaction_type === 'income' ? '+' : '-' }}₹{{ formatAmount(tx.amount) }}
              </td>

              <!-- Actions -->
              <td class="p-4 pr-6 text-center whitespace-nowrap">
                <div class="flex justify-center items-center gap-3">
                  <button 
                    @click="$emit('edit-transaction', tx)"
                    class="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                  >
                    Edit
                  </button>
                  <button 
                    @click="confirmDelete(tx)"
                    class="text-xs font-semibold text-rose-400 hover:text-rose-300 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="transactions.length === 0">
              <td colspan="8" class="p-12 text-center text-sm text-slate-500">
                No transactions found matching the selected filters.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/15">
        <p class="text-xs text-slate-400">
          Showing <span class="font-medium text-slate-300">{{ transactions.length }}</span> items
        </p>
        <div class="flex gap-2">
          <button 
            @click="prevPage" 
            :disabled="page === 1"
            class="px-3 py-1.5 text-xs font-semibold text-slate-300 border border-slate-800 hover:bg-slate-950 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
          >
            Previous
          </button>
          <button 
            @click="nextPage" 
            :disabled="transactions.length < limit"
            class="px-3 py-1.5 text-xs font-semibold text-slate-300 border border-slate-800 hover:bg-slate-950 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { formatDateDDMMYYYY } from '../utils/dateUtils';

const props = defineProps({
  transactions: {
    type: Array,
    required: true
  },
  accounts: {
    type: Array,
    required: true
  },
  categories: {
    type: Array,
    required: true
  },
  buckets: {
    type: Array,
    default: () => []
  },
  page: {
    type: Number,
    required: true
  },
  limit: {
    type: Number,
    required: true
  },
  filters: {
    type: Object,
    required: true
  }
});

const emit = defineEmits([
  'add-transaction', 
  'edit-transaction', 
  'delete-transaction', 
  'update-filters',
  'update-page'
]);

const filters = ref({
  search: props.filters.search || '',
  account_id: props.filters.account_id || '',
  bucket_id: props.filters.bucket_id || '',
  category_ids: props.filters.category_ids ? [...props.filters.category_ids] : [],
  transaction_type: props.filters.transaction_type || '',
  time_range: props.filters.time_range || '',
  start_date: props.filters.start_date || '',
  end_date: props.filters.end_date || ''
});

const startDateInput = ref(props.filters.start_date || '');
const endDateInput = ref(props.filters.end_date || '');

const applyCustomDates = () => {
  filters.value.start_date = startDateInput.value;
  filters.value.end_date = endDateInput.value;
  emitFilters();
};

const showCategoryDropdown = ref(false);

const selectedCategoryNames = computed(() => {
  if (!filters.value.category_ids || filters.value.category_ids.length === 0) {
    return 'All Categories';
  }
  if (filters.value.category_ids.length === 1) {
    const cat = props.categories.find(c => c.id === filters.value.category_ids[0]);
    return cat ? cat.name : '1 Selected';
  }
  return `${filters.value.category_ids.length} Selected`;
});

const clearCategorySelection = () => {
  filters.value.category_ids = [];
  emitFilters();
};

let debounceTimeout;
const debounceFetch = () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    emitFilters();
  }, 350);
};

const emitFilters = () => {
  if (filters.value.time_range !== 'custom') {
    filters.value.start_date = '';
    filters.value.end_date = '';
    startDateInput.value = '';
    endDateInput.value = '';
  }
  emit('update-filters', { ...filters.value });
};

const hasActiveFilters = computed(() => {
  return filters.value.search !== '' || 
         filters.value.account_id !== '' || 
         filters.value.bucket_id !== '' || 
         (filters.value.category_ids && filters.value.category_ids.length > 0) || 
         filters.value.transaction_type !== '' ||
         filters.value.time_range !== '' ||
         filters.value.start_date !== '' ||
         filters.value.end_date !== '';
});

const clearFilters = () => {
  startDateInput.value = '';
  endDateInput.value = '';
  filters.value = {
    search: '',
    account_id: '',
    bucket_id: '',
    category_ids: [],
    transaction_type: '',
    time_range: '',
    start_date: '',
    end_date: ''
  };
  emitFilters();
};

const prevPage = () => {
  if (props.page > 1) {
    emit('update-page', props.page - 1);
  }
};

const nextPage = () => {
  if (props.transactions.length >= props.limit) {
    emit('update-page', props.page + 1);
  }
};

const confirmDelete = (tx) => {
  if (confirm(`Are you sure you want to delete this transaction for ₹${tx.amount} (${tx.description})?`)) {
    emit('delete-transaction', tx.id);
  }
};

// Resolution utilities
const getAccountName = (id) => {
  const account = props.accounts.find(a => a.id === id);
  return account ? account.name : 'Unknown Account';
};

const getCategoryName = (id) => {
  const category = props.categories.find(c => c.id === id);
  return category ? category.name : 'Uncategorized';
};

const getCategoryColor = (id) => {
  const category = props.categories.find(c => c.id === id);
  return category ? category.color : '#6366f1';
};

const getBucketName = (id) => {
  const b = props.buckets.find(b => b.id === id);
  return b ? b.name : 'General';
};

const getBucketIcon = (id) => {
  const b = props.buckets.find(b => b.id === id);
  return b ? (b.icon || '🪣') : '🪣';
};

const formatDate = (dateStr) => {
  return formatDateDDMMYYYY(dateStr);
};

const formatAmount = (val) => {
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
</script>
