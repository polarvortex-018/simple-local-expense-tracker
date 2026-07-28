<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-100 tracking-tight">Financial Overview</h2>
        <p class="text-sm text-slate-400">Real-time summary of your accounts, income, expenses, and savings buckets.</p>
      </div>
      <button 
        @click="$emit('add-transaction')" 
        class="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition duration-150 shadow-lg shadow-indigo-600/20 cursor-pointer shrink-0"
      >
        <span class="text-lg font-bold leading-none">+</span> Add Transaction
      </button>
    </div>

    <!-- Primary Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- Net Worth -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-900/30 p-5 shadow-xl">
        <div class="absolute right-0 top-0 -mt-3 -mr-3 w-20 h-20 rounded-full bg-indigo-600/10 blur-xl"></div>
        <p class="text-xs font-semibold uppercase tracking-wider text-indigo-400/80">Net Worth</p>
        <p class="mt-2 text-2xl font-bold tracking-tight" :class="netWorth >= 0 ? 'text-slate-100' : 'text-rose-400'">
          ₹{{ formatAmount(netWorth) }}
        </p>
        <p class="mt-1 text-[11px] text-slate-400">Total balance across accounts</p>
      </div>

      <!-- Income -->
      <div class="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
        <p class="text-xs font-semibold uppercase tracking-wider text-emerald-400">Total Income</p>
        <p class="mt-2 text-2xl font-bold text-slate-100 tracking-tight">
          ₹{{ formatAmount(totalIncome) }}
        </p>
        <p class="mt-1 text-[11px] text-emerald-500/80 flex items-center gap-1 font-medium">
          ▲ All-time earnings
        </p>
      </div>

      <!-- Expenses -->
      <div class="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
        <p class="text-xs font-semibold uppercase tracking-wider text-rose-400">Total Expenses</p>
        <p class="mt-2 text-2xl font-bold text-slate-100 tracking-tight">
          ₹{{ formatAmount(totalExpenses) }}
        </p>
        <p class="mt-1 text-[11px] text-rose-500/80 flex items-center gap-1 font-medium">
          ▼ All-time spending
        </p>
      </div>

      <!-- Savings Rate / Health -->
      <div class="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
        <p class="text-xs font-semibold uppercase tracking-wider text-amber-400">Savings Rate</p>
        <p class="mt-2 text-2xl font-bold tracking-tight" :class="savingsRate >= 0 ? 'text-amber-300' : 'text-rose-400'">
          {{ savingsRate }}%
        </p>
        <p class="mt-1 text-[11px] text-slate-400">
          {{ savingsRate >= 0 ? 'Net positive savings ratio' : 'Expenses exceed income' }}
        </p>
      </div>
    </div>

    <!-- SAVINGS BUCKETS BREAKDOWN (AT TOP) -->
    <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-base font-semibold text-slate-200">Savings Buckets</h3>
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-900/50">
              Click any bucket to add transaction
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">Where your money is allocated & why it exists</p>
        </div>
        <div class="text-right">
          <span class="text-xs text-slate-400">Total Allocated: </span>
          <strong class="text-indigo-400 text-sm font-bold">₹{{ formatAmount(totalBucketAllocated) }}</strong>
        </div>
      </div>

      <div v-if="activeBuckets.length === 0" class="text-center py-8 text-xs text-slate-500">
        No active savings buckets configured. Go to Settings -> Savings Buckets to add custom buckets.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="bucket in activeBuckets" 
          :key="bucket.id"
          @click="$emit('add-transaction', { bucketId: bucket.id, type: 'expense' })"
          class="group p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:bg-indigo-950/20 hover:border-indigo-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 shadow-md hover:shadow-indigo-500/10 transform hover:-translate-y-0.5"
          title="Click to manage transactions for this bucket"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg shrink-0 shadow-sm group-hover:scale-110 transition">
                {{ bucket.icon || '🪣' }}
              </span>
              <div>
                <p class="text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition truncate max-w-[120px]">{{ bucket.name }}</p>
                <span class="text-[10px] text-slate-400 font-medium">Purpose Allocation</span>
              </div>
            </div>
            <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" :style="{ backgroundColor: bucket.color || '#6366f1' }"></span>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <div>
              <span class="text-[10px] text-slate-400 block">Allocated Balance</span>
              <span class="text-base font-bold" :class="bucket.allocated_balance >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                ₹{{ formatAmount(bucket.allocated_balance) }}
              </span>
            </div>

            <!-- Quick Action Buttons: Income vs Expense -->
            <div class="flex gap-1.5 shrink-0" @click.stop>
              <button 
                type="button"
                @click="$emit('add-transaction', { bucketId: bucket.id, type: 'income' })"
                class="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/50 transition cursor-pointer flex items-center gap-1 shadow-sm"
                title="Add Income to this bucket"
              >
                <span>+ Income</span>
              </button>
              <button 
                type="button"
                @click="$emit('add-transaction', { bucketId: bucket.id, type: 'expense' })"
                class="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-400 border border-rose-800/50 transition cursor-pointer flex items-center gap-1 shadow-sm"
                title="Record Expense from this bucket"
              >
                <span>- Expense</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Analytics Section (Pie Chart & Accounts) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Category Breakdown (Default: This Month with Time Filters) -->
      <div class="lg:col-span-2 bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h3 class="text-base font-semibold text-slate-200">Category Spending Breakdown</h3>
            <p class="text-xs text-slate-400">Interactive visual breakdown of expenses by category</p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- Time Filter Dropdown (Default: This Month) -->
            <select 
              v-model="timeRange"
              @change="fetchSummary"
              class="px-3 py-1 bg-slate-950 border border-slate-800 hover:bg-slate-900 focus:border-indigo-600 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none transition cursor-pointer"
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_6_months">Last 6 Months</option>
              <option value="this_year">This Year</option>
              <option value="all_time">All Time</option>
            </select>

            <!-- View Mode Toggle Buttons -->
            <div class="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
              <button 
                @click="chartType = 'pie'"
                class="px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5"
                :class="chartType === 'pie' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'"
              >
                <span>Pie Chart</span>
              </button>
              <button 
                @click="chartType = 'bars'"
                class="px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5"
                :class="chartType === 'bars' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'"
              >
                <span>Bar List</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="loadingSummary" class="flex flex-col items-center justify-center py-16 gap-2">
          <div class="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs text-slate-500">Calculating stats...</p>
        </div>

        <div v-else-if="categorySpending.length === 0" class="text-center py-16 text-sm text-slate-500">
          No expense data found for the selected time range.
        </div>

        <div v-else>
          <!-- Donut Pie Chart Mode (Responsive Non-overlapping Path Slices) -->
          <div v-if="chartType === 'pie'" class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <!-- SVG Pie Donut Chart -->
            <div class="md:col-span-6 flex flex-col items-center justify-center relative">
              <div class="relative w-60 h-60 flex items-center justify-center">
                <svg class="w-full h-full" viewBox="0 0 200 200">
                  <!-- Category Donut Slice Paths -->
                  <path
                    v-for="(segment, idx) in piePaths"
                    :key="segment.id"
                    :d="segment.d"
                    :fill="segment.color"
                    class="transition-all duration-200 cursor-pointer"
                    :class="{ 
                      'opacity-100 scale-105 filter drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]': hoveredIndex === idx, 
                      'opacity-85 hover:opacity-100': hoveredIndex === null || hoveredIndex !== idx 
                    }"
                    style="transform-origin: 100px 100px;"
                    @mouseenter="hoveredIndex = idx"
                    @mouseleave="hoveredIndex = null"
                  />
                </svg>

                <!-- Center Text Overlay -->
                <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
                  <template v-if="activeCategoryInfo">
                    <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate max-w-[130px]">
                      {{ activeCategoryInfo.name }}
                    </span>
                    <span class="text-lg font-bold text-slate-100 tracking-tight">
                      ₹{{ formatAmount(activeCategoryInfo.amount) }}
                    </span>
                    <span class="text-xs font-semibold text-indigo-400">
                      {{ activeCategoryInfo.percentage }}%
                    </span>
                  </template>
                  <template v-else>
                    <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Total Expenses
                    </span>
                    <span class="text-base font-bold text-slate-100 tracking-tight">
                      ₹{{ formatAmount(totalFilteredExpenses) }}
                    </span>
                    <span class="text-[10px] text-slate-500">
                      {{ categorySpending.length }} Categories
                    </span>
                  </template>
                </div>
              </div>
            </div>

            <!-- Legend List -->
            <div class="md:col-span-6 space-y-2.5">
              <div 
                v-for="(category, idx) in categorySpending" 
                :key="category.id"
                @mouseenter="hoveredIndex = idx"
                @mouseleave="hoveredIndex = null"
                class="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/60 bg-slate-950/30 hover:border-slate-700/60 transition cursor-pointer"
                :class="{ 'border-indigo-500 bg-slate-950/90 shadow-md': hoveredIndex === idx }"
              >
                <div class="flex items-center gap-2.5">
                  <span class="w-3 h-3 rounded-full shrink-0 shadow-sm" :style="{ backgroundColor: category.color }"></span>
                  <span class="text-xs font-medium text-slate-200">{{ category.name }}</span>
                </div>
                <div class="text-right">
                  <span class="text-xs font-semibold text-slate-100">₹{{ formatAmount(category.amount) }}</span>
                  <span class="text-[10px] text-slate-400 block font-normal">{{ category.percentage }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bar List Mode -->
          <div v-else class="space-y-4">
            <div 
              v-for="category in categorySpending" 
              :key="category.id" 
              class="space-y-2"
            >
              <div class="flex justify-between text-sm">
                <span class="font-medium text-slate-300 flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: category.color }"></span>
                  {{ category.name }}
                </span>
                <div class="space-x-2">
                  <span class="font-semibold text-slate-200">₹{{ formatAmount(category.amount) }}</span>
                  <span class="text-slate-500 text-xs">({{ category.percentage }}%)</span>
                </div>
              </div>
              <div class="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-300"
                  :style="{ width: `${category.percentage}%`, backgroundColor: category.color }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Account List (Storage Location) -->
      <div class="lg:col-span-1 bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-base font-semibold text-slate-200">Where Money Is Stored</h3>
              <p class="text-xs text-slate-400">Physical account balances</p>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950 border border-slate-800 text-slate-400">
              {{ accounts.length }} Accounts
            </span>
          </div>

          <div class="space-y-3">
            <div 
              v-for="account in accounts" 
              :key="account.id" 
              class="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/30 hover:border-slate-700/50 transition duration-150"
            >
              <div class="flex items-center gap-3">
                <div 
                  class="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                  :class="getAccountTypeClass(account.type)"
                >
                  {{ account.name[0] }}
                </div>
                <div>
                  <p class="text-sm font-medium text-slate-200 truncate max-w-[110px]">{{ account.name }}</p>
                  <p class="text-xs text-slate-400">{{ account.type }}</p>
                </div>
              </div>
              <p class="text-sm font-semibold whitespace-nowrap" :class="account.balance >= 0 ? 'text-slate-200' : 'text-rose-400'">
                ₹{{ formatAmount(account.balance) }}
              </p>
            </div>

            <div v-if="accounts.length === 0" class="text-center py-6 text-sm text-slate-500">
              No accounts configured.
            </div>
          </div>
        </div>

        <div class="p-3.5 bg-slate-950/50 border border-slate-800/80 rounded-xl text-xs space-y-1.5">
          <div class="flex justify-between text-slate-400">
            <span>Highest Expense Category:</span>
            <strong class="text-indigo-400">{{ topCategoryName }}</strong>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>Total Account Balances:</span>
            <strong class="text-slate-200">₹{{ formatAmount(netWorth) }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Transactions Activity Section -->
    <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-base font-semibold text-slate-200">Recent Activity</h3>
          <p class="text-xs text-slate-400">Latest recorded financial entries</p>
        </div>
      </div>

      <div class="divide-y divide-slate-800/60 border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/20">
        <div 
          v-for="tx in recentTransactions" 
          :key="tx.id"
          class="p-3.5 flex items-center justify-between hover:bg-slate-950/40 transition"
        >
          <div class="flex items-center gap-3">
            <div 
              class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
              :class="tx.transaction_type === 'income' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'"
            >
              {{ tx.transaction_type === 'income' ? '↓' : '↑' }}
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-200">{{ tx.description }}</p>
              <p class="text-[10px] text-slate-400">
                {{ formatDate(tx.date) }} • {{ getAccountName(tx.account_id) }} • <span class="text-indigo-400 font-medium">{{ getBucketName(tx.bucket_id) }}</span>
              </p>
            </div>
          </div>
          <span 
            class="text-xs font-bold whitespace-nowrap"
            :class="tx.transaction_type === 'income' ? 'text-emerald-400' : 'text-slate-200'"
          >
            {{ tx.transaction_type === 'income' ? '+' : '-' }}₹{{ formatAmount(tx.amount) }}
          </span>
        </div>

        <div v-if="recentTransactions.length === 0" class="p-6 text-center text-xs text-slate-500">
          No recent activity to display.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { api } from '../services/api';
import { formatDateDDMMYYYY } from '../utils/dateUtils';

const props = defineProps({
  accounts: {
    type: Array,
    required: true
  },
  transactions: {
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
  }
});

defineEmits(['add-transaction']);

const summaryData = ref(null);
const loadingSummary = ref(false);
const chartType = ref('pie'); // 'pie' or 'bars'
const timeRange = ref('this_month'); // Default: 'this_month'
const hoveredIndex = ref(null);

const calculateDateBounds = (range) => {
  if (range === 'all_time') return { start_date: null, end_date: null };

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const fmt = (dObj) => {
    const y = dObj.getFullYear();
    const m = String(dObj.getMonth() + 1).padStart(2, '0');
    const d = String(dObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  switch (range) {
    case 'this_month': {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return { start_date: fmt(start), end_date: fmt(end) };
    }
    case 'last_month': {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return { start_date: fmt(start), end_date: fmt(end) };
    }
    case 'last_3_months': {
      const start = new Date(year, month - 3, 1);
      const end = new Date(year, month + 1, 0);
      return { start_date: fmt(start), end_date: fmt(end) };
    }
    case 'last_6_months': {
      const start = new Date(year, month - 6, 1);
      const end = new Date(year, month + 1, 0);
      return { start_date: fmt(start), end_date: fmt(end) };
    }
    case 'this_year': {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      return { start_date: fmt(start), end_date: fmt(end) };
    }
    default:
      return { start_date: null, end_date: null };
  }
};

const fetchSummary = async () => {
  loadingSummary.value = true;
  try {
    const { start_date, end_date } = calculateDateBounds(timeRange.value);
    summaryData.value = await api.getTransactionSummary({ start_date, end_date });
  } catch (err) {
    console.error('Failed to fetch summary stats:', err);
  } finally {
    loadingSummary.value = false;
  }
};

onMounted(() => {
  fetchSummary();
});

watch(() => props.transactions, () => {
  fetchSummary();
}, { deep: true });

// Formatting helpers
const formatAmount = (val) => {
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  return formatDateDDMMYYYY(dateStr);
};

// Active buckets
const activeBuckets = computed(() => {
  return props.buckets.filter(b => !b.is_archived);
});

const totalBucketAllocated = computed(() => {
  return activeBuckets.value.reduce((sum, b) => sum + Number(b.allocated_balance || 0), 0);
});

// Net Worth
const netWorth = computed(() => {
  return props.accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
});

// Income & Expenses
const totalIncome = computed(() => {
  return props.transactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
});

const totalExpenses = computed(() => {
  return props.transactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
});

const totalFilteredExpenses = computed(() => {
  if (summaryData.value && summaryData.value.total_expenses !== undefined) {
    return Number(summaryData.value.total_expenses);
  }
  return totalExpenses.value;
});

// Savings Rate calculation
const savingsRate = computed(() => {
  const inc = totalIncome.value;
  const exp = totalExpenses.value;
  if (inc <= 0) return 0;
  const rate = ((inc - exp) / inc) * 100;
  return Math.round(rate * 10) / 10;
});

// Category Breakdown calculations based on summaryData for chosen timeRange
const categorySpending = computed(() => {
  if (summaryData.value && summaryData.value.category_breakdown) {
    return summaryData.value.category_breakdown.map((item, idx) => {
      const cat = props.categories.find(c => c.id === item.category_id);
      return {
        id: item.category_id,
        name: cat ? cat.name : 'Uncategorized',
        color: cat ? cat.color : '#6366f1',
        amount: Number(item.amount),
        percentage: item.percentage,
        index: idx
      };
    }).sort((a, b) => b.amount - a.amount);
  }
  return [];
});

// High-precision non-overlapping SVG Path-Arc computation for Pie Chart
const piePaths = computed(() => {
  const total = totalFilteredExpenses.value;
  if (!total || categorySpending.value.length === 0) return [];

  const cx = 100;
  const cy = 100;
  const outerR = 80;
  const innerR = 52;

  let currentAngle = -Math.PI / 2;

  return categorySpending.value.map((item) => {
    const fraction = item.amount / total;
    const angleSpan = fraction * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleSpan;
    currentAngle = endAngle;

    const x1o = cx + outerR * Math.cos(startAngle);
    const y1o = cy + outerR * Math.sin(startAngle);
    const x2o = cx + outerR * Math.cos(endAngle);
    const y2o = cy + outerR * Math.sin(endAngle);

    const x1i = cx + innerR * Math.cos(startAngle);
    const y1i = cy + innerR * Math.sin(startAngle);
    const x2i = cx + innerR * Math.cos(endAngle);
    const y2i = cy + innerR * Math.sin(endAngle);

    const largeArc = angleSpan > Math.PI ? 1 : 0;

    const d = [
      `M ${x1o} ${y1o}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
      `L ${x2i} ${y2i}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1i} ${y1i}`,
      'Z'
    ].join(' ');

    return {
      ...item,
      d
    };
  });
});

const activeCategoryInfo = computed(() => {
  if (hoveredIndex.value !== null && categorySpending.value[hoveredIndex.value]) {
    return categorySpending.value[hoveredIndex.value];
  }
  return null;
});

const topCategoryName = computed(() => {
  if (categorySpending.value.length > 0) {
    return categorySpending.value[0].name;
  }
  return 'N/A';
});

const recentTransactions = computed(() => {
  return props.transactions.slice(0, 5);
});

const getAccountName = (accId) => {
  const acc = props.accounts.find(a => a.id === accId);
  return acc ? acc.name : 'Account';
};

const getBucketName = (bId) => {
  const b = props.buckets.find(b => b.id === bId);
  return b ? b.name : 'General';
};

const getAccountTypeClass = (type) => {
  switch (type) {
    case 'Savings':
      return 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40';
    case 'Checking':
      return 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/40';
    case 'Credit Card':
      return 'bg-rose-950/60 text-rose-400 border border-rose-800/40';
    default:
      return 'bg-slate-800 text-slate-300 border border-slate-700/40';
  }
};
</script>
