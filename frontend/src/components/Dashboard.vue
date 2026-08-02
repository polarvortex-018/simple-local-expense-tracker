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

    <!-- 1. SAVINGS BUCKETS BREAKDOWN (AT THE VERY TOP) -->
    <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/80 pb-3.5">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="text-base font-bold text-slate-100">Savings Buckets</h3>
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-900/50">
              Purpose Allocations
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

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        <div 
          v-for="bucket in activeBuckets" 
          :key="bucket.id"
          @click="$emit('add-transaction', { bucketId: bucket.id, type: 'expense' })"
          class="group p-3.5 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:bg-indigo-950/20 hover:border-indigo-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 shadow-md hover:shadow-indigo-500/10"
          title="Click to manage transactions for this bucket"
        >
          <!-- Top Row: Icon, Name & Color Indicator -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 overflow-hidden">
              <span class="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-base shrink-0 shadow-sm group-hover:scale-105 transition">
                {{ bucket.icon || '🪣' }}
              </span>
              <div class="overflow-hidden">
                <p class="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition truncate">{{ bucket.name }}</p>
                <span class="text-[9px] text-slate-400 block truncate">Allocation</span>
              </div>
            </div>
            <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" :style="{ backgroundColor: bucket.color || '#6366f1' }"></span>
          </div>

          <!-- Middle Row: Allocated Balance -->
          <div class="pt-1">
            <span class="text-[10px] text-slate-400 block font-medium">Allocated Balance</span>
            <span class="text-base font-bold tracking-tight block truncate" :class="bucket.allocated_balance >= 0 ? 'text-emerald-400' : 'text-rose-400'">
              ₹{{ formatAmount(bucket.allocated_balance) }}
            </span>
          </div>

          <!-- Bottom Row: Quick Action Buttons (2-Column Grid to Prevent Text Overlap) -->
          <div class="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/60" @click.stop>
            <button 
              type="button"
              @click="$emit('add-transaction', { bucketId: bucket.id, type: 'income' })"
              class="w-full py-1 px-1 text-[10px] font-bold rounded-lg bg-emerald-950/80 hover:bg-emerald-900 active:bg-emerald-950 text-emerald-400 border border-emerald-800/50 transition cursor-pointer flex items-center justify-center gap-0.5 shadow-sm active:scale-95"
              title="Add Income to this bucket"
            >
              <span>+ Income</span>
            </button>
            <button 
              type="button"
              @click="$emit('add-transaction', { bucketId: bucket.id, type: 'expense' })"
              class="w-full py-1 px-1 text-[10px] font-bold rounded-lg bg-rose-950/80 hover:bg-rose-900 active:bg-rose-950 text-rose-400 border border-rose-800/50 transition cursor-pointer flex items-center justify-center gap-0.5 shadow-sm active:scale-95"
              title="Record Expense from this bucket"
            >
              <span>- Expense</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. PRIMARY METRIC CARDS -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
      <!-- Net Worth -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-900/30 p-4 sm:p-5 shadow-xl">
        <div class="absolute right-0 top-0 -mt-3 -mr-3 w-20 h-20 rounded-full bg-indigo-600/10 blur-xl"></div>
        <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-400/80">Net Worth</p>
        <p class="mt-1.5 text-lg sm:text-2xl font-bold tracking-tight truncate" :class="netWorth >= 0 ? 'text-slate-100' : 'text-rose-400'">
          ₹{{ formatAmount(netWorth) }}
        </p>
        <p class="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 truncate">Total account balances</p>
      </div>

      <!-- Income -->
      <div class="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 shadow-xl">
        <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-400">Total Income</p>
        <p class="mt-1.5 text-lg sm:text-2xl font-bold text-slate-100 tracking-tight truncate">
          ₹{{ formatAmount(totalIncome) }}
        </p>
        <p class="mt-0.5 text-[10px] sm:text-[11px] text-emerald-500/80 flex items-center gap-1 font-medium truncate">
          ▲ All-time earnings
        </p>
      </div>

      <!-- Expenses -->
      <div class="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 shadow-xl">
        <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-rose-400">Total Expenses</p>
        <p class="mt-1.5 text-lg sm:text-2xl font-bold text-slate-100 tracking-tight truncate">
          ₹{{ formatAmount(totalExpenses) }}
        </p>
        <p class="mt-0.5 text-[10px] sm:text-[11px] text-rose-500/80 flex items-center gap-1 font-medium truncate">
          ▼ All-time spending
        </p>
      </div>

      <!-- Savings Rate / Health -->
      <div class="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 shadow-xl">
        <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-400">Savings Rate</p>
        <p class="mt-1.5 text-lg sm:text-2xl font-bold tracking-tight truncate" :class="savingsRate >= 0 ? 'text-amber-300' : 'text-rose-400'">
          {{ savingsRate }}%
        </p>
        <p class="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 truncate">
          {{ savingsRate >= 0 ? 'Net positive ratio' : 'Expenses exceed income' }}
        </p>
      </div>
    </div>

    <!-- Main Analytics Section (Pie Chart & Accounts) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Category Breakdown (Default: This Month with Time Filters) -->
      <div class="lg:col-span-2 bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h3 class="text-base font-semibold text-slate-200">Category Spending Breakdown</h3>
            <p class="text-xs text-slate-400 mt-0.5">Interactive visual breakdown of expenses by category</p>
          </div>

          <!-- Time Horizon Filter Selector -->
          <div class="flex items-center gap-2 self-stretch sm:self-auto">
            <span class="text-xs text-slate-400 font-medium whitespace-nowrap">Period:</span>
            <select 
              v-model="dashboardTimeRange"
              class="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-850 focus:bg-slate-950 focus:border-indigo-600 rounded-xl text-slate-200 text-xs font-medium focus:outline-none transition cursor-pointer w-full sm:w-auto"
            >
              <option value="this_month">This Month (Default)</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_6_months">Last 6 Months</option>
              <option value="this_year">This Year</option>
              <option value="all_time">All Time</option>
            </select>
          </div>
        </div>

        <div v-if="filteredCategoryExpenses.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <!-- Pie Chart Canvas Container -->
          <div class="relative flex items-center justify-center p-2 min-h-[220px]">
            <canvas ref="chartCanvas" class="max-w-[220px] max-h-[220px]"></canvas>
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span class="text-xs font-medium text-slate-400">Total Spent</span>
              <span class="text-lg font-bold text-slate-100">₹{{ formatAmount(totalFilteredCategoryExpense) }}</span>
            </div>
          </div>

          <!-- Category Legend & Percentage Breakdown -->
          <div class="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
            <div 
              v-for="cat in categoryLegendList" 
              :key="cat.name"
              class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/40 hover:bg-slate-950/80 transition"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" :style="{ backgroundColor: cat.color }"></span>
                <span class="text-xs font-semibold text-slate-200 truncate">{{ cat.name }}</span>
              </div>
              <div class="text-right shrink-0">
                <span class="text-xs font-bold text-slate-100">₹{{ formatAmount(cat.total) }}</span>
                <span class="text-[10px] text-slate-400 block font-normal">{{ cat.percentage }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-xs text-slate-500 border border-dashed border-slate-800/60 rounded-xl">
          No expenses recorded for the selected time period.
        </div>
      </div>

      <!-- Accounts List -->
      <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h3 class="text-base font-semibold text-slate-200">Storage Accounts</h3>
          <p class="text-xs text-slate-400 mt-0.5">Where your physical cash/money is stored</p>
        </div>

        <div v-if="accounts.length > 0" class="divide-y divide-slate-800/60 border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/20">
          <div 
            v-for="acc in accounts" 
            :key="acc.id"
            class="p-3.5 flex items-center justify-between hover:bg-slate-950/40 transition duration-150"
          >
            <div>
              <p class="text-xs font-semibold text-slate-200">{{ acc.name }}</p>
              <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-900 text-slate-400 border border-slate-800 mt-1 inline-block">
                {{ acc.type }}
              </span>
            </div>
            <span class="text-xs font-bold" :class="acc.balance >= 0 ? 'text-slate-100' : 'text-rose-400'">
              ₹{{ formatAmount(acc.balance) }}
            </span>
          </div>
        </div>
        <div v-else class="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800/60 rounded-xl">
          No accounts configured yet.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';

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

const chartCanvas = ref(null);
const dashboardTimeRange = ref('this_month');

// Primary Metrics
const netWorth = computed(() => {
  return props.accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
});

const totalIncome = computed(() => {
  return props.transactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
});

const totalExpenses = computed(() => {
  return props.transactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
});

const savingsRate = computed(() => {
  if (totalIncome.value <= 0) return 0;
  const saved = totalIncome.value - totalExpenses.value;
  return Math.round((saved / totalIncome.value) * 100);
});

const activeBuckets = computed(() => props.buckets.filter(b => !b.is_archived));
const totalBucketAllocated = computed(() => {
  return activeBuckets.value.reduce((sum, b) => sum + (Number(b.allocated_balance) || 0), 0);
});

// Category Spending Filtered by Dashboard Period Choice
const filteredCategoryExpenses = computed(() => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const isMatchingDate = (dateStr) => {
    if (!dateStr || dashboardTimeRange.value === 'all_time') return true;
    const tDate = new Date(dateStr);
    const tYear = tDate.getFullYear();
    const tMonth = tDate.getMonth();

    switch (dashboardTimeRange.value) {
      case 'this_month':
        return tYear === year && tMonth === month;
      case 'last_month': {
        const targetMonth = month === 0 ? 11 : month - 1;
        const targetYear = month === 0 ? year - 1 : year;
        return tYear === targetYear && tMonth === targetMonth;
      }
      case 'last_3_months': {
        const threeMonthsAgo = new Date(year, month - 3, 1);
        return tDate >= threeMonthsAgo;
      }
      case 'last_6_months': {
        const sixMonthsAgo = new Date(year, month - 6, 1);
        return tDate >= sixMonthsAgo;
      }
      case 'this_year':
        return tYear === year;
      default:
        return true;
    }
  };

  const map = {};
  props.transactions.forEach(t => {
    if (t.transaction_type === 'expense' && isMatchingDate(t.date)) {
      const catName = t.category?.name || 'Uncategorized';
      const catColor = t.category?.color || '#64748b';
      const amt = Number(t.amount) || 0;
      if (!map[catName]) {
        map[catName] = { name: catName, color: catColor, total: 0 };
      }
      map[catName].total += amt;
    }
  });

  return Object.values(map).sort((a, b) => b.total - a.total);
});

const totalFilteredCategoryExpense = computed(() => {
  return filteredCategoryExpenses.value.reduce((sum, c) => sum + c.total, 0);
});

const categoryLegendList = computed(() => {
  const total = totalFilteredCategoryExpense.value;
  return filteredCategoryExpenses.value.map(c => ({
    ...c,
    percentage: total > 0 ? Math.round((c.total / total) * 100) : 0
  }));
});

// Render Donut/Pie Chart on Canvas
const renderPieChart = () => {
  if (!chartCanvas.value) return;
  const ctx = chartCanvas.value.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  
  const width = 220;
  const height = 220;
  chartCanvas.value.width = width * dpr;
  chartCanvas.value.height = height * dpr;
  chartCanvas.value.style.width = `${width}px`;
  chartCanvas.value.style.height = `${height}px`;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const data = filteredCategoryExpenses.value;
  const total = totalFilteredCategoryExpense.value;

  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = 90;
  const innerRadius = 60;

  if (data.length === 0 || total <= 0) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI, true);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    return;
  }

  let startAngle = -0.5 * Math.PI;

  data.forEach(item => {
    const sliceAngle = (item.total / total) * (2 * Math.PI);
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    startAngle = endAngle;
  });
};

watch(filteredCategoryExpenses, () => {
  nextTick(renderPieChart);
}, { deep: true });

onMounted(() => {
  nextTick(renderPieChart);
});

const formatAmount = (val) => {
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
</script>
