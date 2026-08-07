<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
      <div>
        <h2 class="text-xl font-bold text-slate-100 tracking-tight">Financial Overview</h2>
        <p class="text-xs text-slate-400">Real-time summary of accounts, income, expenses, and savings buckets.</p>
      </div>
    </div>

    <!-- 1. HERO FOCUS CTA CARD: ADD TRANSACTION (Full-width rounded-pill primary purple) -->
    <div 
      @click="$emit('add-transaction')" 
      class="rounded-lg bg-[#131b2e] border border-[#31394d] p-4 shadow-sm hover:border-[#7c3aed] transition cursor-pointer group"
    >
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <div class="w-10 h-10 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-lg font-bold shrink-0">
            ＋
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 group-hover:text-[#7c3aed] transition">Log New Transaction</h3>
            <p class="text-xs text-slate-400">Record an expense or income entry in 1 tap</p>
          </div>
        </div>

        <button 
          type="button"
          class="w-full sm:w-auto px-6 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-full shadow-sm transition flex items-center justify-center gap-1.5"
        >
          <span>＋ Add Transaction</span>
        </button>
      </div>
    </div>

    <!-- 2. PRIMARY METRIC CARDS -->
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <!-- Net Worth -->
      <div class="rounded-lg bg-[#131b2e] border border-[#31394d] p-3.5 shadow-sm">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Worth</p>
        <p class="mt-1 text-lg sm:text-xl font-bold tracking-tight truncate" :class="netWorth >= 0 ? 'text-slate-100' : 'text-[#ef4444]'">
          ₹{{ formatAmount(netWorth) }}
        </p>
        <p class="mt-0.5 text-[10px] text-slate-400 truncate">Total account balances</p>
      </div>

      <!-- Income -->
      <div class="rounded-lg bg-[#131b2e] border border-[#31394d] p-3.5 shadow-sm">
        <p class="text-[10px] font-bold uppercase tracking-wider text-[#10b981]">Total Income</p>
        <p class="mt-1 text-lg sm:text-xl font-bold text-slate-100 tracking-tight truncate">
          ₹{{ formatAmount(totalIncome) }}
        </p>
        <p class="mt-0.5 text-[10px] text-[#10b981] font-medium truncate">
          ▲ All-time earnings
        </p>
      </div>

      <!-- Expenses -->
      <div class="rounded-lg bg-[#131b2e] border border-[#31394d] p-3.5 shadow-sm col-span-2 lg:col-span-1">
        <p class="text-[10px] font-bold uppercase tracking-wider text-[#ef4444]">Total Expenses</p>
        <p class="mt-1 text-lg sm:text-xl font-bold text-slate-100 tracking-tight truncate">
          ₹{{ formatAmount(totalExpenses) }}
        </p>
        <p class="mt-0.5 text-[10px] text-[#ef4444] font-medium truncate">
          ▼ All-time spending
        </p>
      </div>

    </div>

    <!-- 3. SAVINGS BUCKETS BREAKDOWN (High Density Grid) -->
    <div class="bg-[#131b2e] border border-[#31394d] rounded-lg p-4 space-y-3">
      <div class="flex justify-between items-center border-b border-[#31394d] pb-2.5">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-bold text-slate-100 tracking-tight">Savings Buckets</h3>
          <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#7c3aed]/20 text-purple-300 border border-[#7c3aed]/30">
            Purpose Allocations
          </span>
        </div>
      </div>

      <div v-if="activeBuckets.length === 0" class="text-center py-6 text-xs text-slate-500">
        No active savings buckets configured. Go to Settings -> Savings Buckets to add custom buckets.
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        <div 
          v-for="bucket in activeBuckets" 
          :key="bucket.id"
          @click="$emit('add-transaction', { bucketId: bucket.id, type: 'expense' })"
          class="p-3 rounded-lg border border-[#31394d] bg-[#0b1326] hover:border-[#7c3aed] transition cursor-pointer flex flex-col justify-between space-y-2"
          title="Click to manage transactions for this bucket"
        >
          <!-- Top Row: Icon, Name & Color Indicator -->
          <div class="flex items-center justify-between gap-1.5">
            <div class="flex items-center gap-2 overflow-hidden">
              <span class="w-7 h-7 rounded-md bg-[#131b2e] border border-[#31394d] flex items-center justify-center text-sm shrink-0">
                {{ bucket.icon || '🪣' }}
              </span>
              <div class="overflow-hidden">
                <p class="text-xs font-bold text-slate-200 truncate">{{ bucket.name }}</p>
              </div>
            </div>
            <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: bucket.color || '#7c3aed' }"></span>
          </div>

          <!-- Middle Row: Allocated Balance -->
          <div class="pt-0.5">
            <span class="text-[10px] text-slate-400 block font-medium">Allocated Balance</span>
            <span class="text-sm font-bold tracking-tight block truncate" :class="bucket.allocated_balance >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'">
              ₹{{ formatAmount(bucket.allocated_balance) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Main Analytics Section (Thin-Stroke Donut Chart & Accounts) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Category Breakdown -->
      <div class="lg:col-span-2 bg-[#131b2e] border border-[#31394d] rounded-lg p-4 space-y-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#31394d] pb-2.5">
          <div>
            <h3 class="text-sm font-bold text-slate-100 tracking-tight">Category Spending Breakdown</h3>
            <p class="text-xs text-slate-400">Interactive visual breakdown of expenses</p>
          </div>

          <!-- Time Horizon Filter Selector -->
          <div class="flex items-center gap-2 self-stretch sm:self-auto">
            <span class="text-xs text-slate-400 font-medium whitespace-nowrap">Period:</span>
            <select 
              v-model="dashboardTimeRange"
              class="px-2.5 py-1 bg-[#0b1326] border border-[#31394d] rounded-md text-slate-200 text-xs font-medium focus:outline-none focus:border-[#7c3aed] transition cursor-pointer w-full sm:w-auto"
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

        <div v-if="filteredCategoryExpenses.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <!-- Donut Chart Canvas Container -->
          <div class="relative flex items-center justify-center p-2 min-h-[200px]">
            <canvas ref="chartCanvas" class="max-w-[200px] max-h-[200px]"></canvas>
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Spent</span>
              <span class="text-base font-bold text-slate-100 tracking-tight">₹{{ formatAmount(totalFilteredCategoryExpense) }}</span>
            </div>
          </div>

          <!-- Category Legend & Percentage Breakdown -->
          <div class="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
            <div 
              v-for="cat in categoryLegendList" 
              :key="cat.name"
              class="flex items-center justify-between p-2 rounded-md bg-[#0b1326] border border-[#31394d] hover:border-slate-600 transition"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: cat.color }"></span>
                <span class="text-xs font-semibold text-slate-200 truncate">{{ cat.name }}</span>
              </div>
              <div class="text-right shrink-0">
                <span class="text-xs font-bold text-slate-100">₹{{ formatAmount(cat.total) }}</span>
                <span class="text-[10px] text-slate-400 block font-normal">{{ cat.percentage }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-xs text-slate-500 border border-dashed border-[#31394d] rounded-lg">
          No expenses recorded for the selected time period.
        </div>
      </div>

      <!-- Accounts List -->
      <div class="bg-[#131b2e] border border-[#31394d] rounded-lg p-4 space-y-4">
        <div>
          <h3 class="text-sm font-bold text-slate-100 tracking-tight">Storage Accounts</h3>
          <p class="text-xs text-slate-400">Where physical cash/money is stored</p>
        </div>

        <div v-if="accounts.length > 0" class="divide-y divide-[#31394d] border border-[#31394d] rounded-lg overflow-hidden bg-[#0b1326]">
          <div 
            v-for="acc in accounts" 
            :key="acc.id"
            class="p-3 flex items-center justify-between hover:bg-[#131b2e] transition"
          >
            <div>
              <p class="text-xs font-bold text-slate-200">{{ acc.name }}</p>
              <p class="text-[10px] text-slate-400">{{ acc.type }}</p>
            </div>
            <span class="text-xs font-bold tracking-tight" :class="acc.balance >= 0 ? 'text-slate-100' : 'text-[#ef4444]'">
              ₹{{ formatAmount(acc.balance) }}
            </span>
          </div>
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

// This is the single source for both rendered cards and the displayed total.
const activeBuckets = computed(() => props.buckets.filter(bucket => {
  if (bucket.is_archived) return false;
  return Number.isFinite(Number(bucket.allocated_balance));
}));

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
