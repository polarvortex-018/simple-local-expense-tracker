<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
      <div>
        <h2 class="text-xl font-bold text-[#dae2fd] tracking-tight">Financial Overview</h2>
        <p class="text-xs text-[#ccc3d8]">Real-time summary of your accounts, income, expenses, and savings buckets.</p>
      </div>
    </div>

    <!-- 1. Net Worth & Income/Expense Metrics Bar -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <!-- Net Worth Card (with subtle primary purple glow) -->
      <section class="bg-[#131b2e] border border-[#31394d] rounded-lg p-4 flex flex-col gap-2 shadow-[0_0_24px_-4px_rgba(124,58,237,0.15)] relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-[#7c3aed]/10 to-transparent pointer-events-none"></div>
        <div class="flex justify-between items-center z-10">
          <h2 class="text-xs font-semibold text-[#ccc3d8] uppercase tracking-wider">Net Worth</h2>
          <div class="flex items-center gap-1 bg-[#00a572]/20 text-[#4edea3] px-2 py-0.5 rounded-full text-xs font-bold">
            <span class="material-symbols-outlined text-[14px]">trending_up</span>
            <span>+2.4%</span>
          </div>
        </div>
        <div class="text-2xl font-bold text-[#dae2fd] tabular-nums z-10 tracking-tight" :class="netWorth >= 0 ? 'text-[#dae2fd]' : 'text-[#ffb4ab]'">
          ₹{{ formatAmount(netWorth) }}
        </div>
      </section>

      <!-- Income & Expense Summary Side-by-Side Cards -->
      <div class="flex gap-3 col-span-1 md:col-span-1 lg:col-span-2">
        <!-- Income -->
        <section class="bg-[#131b2e] border border-[#31394d] rounded-lg p-4 flex-1 flex flex-col justify-between gap-1">
          <div class="flex items-center gap-1.5 text-[#ccc3d8]">
            <span class="material-symbols-outlined text-[16px] text-[#4edea3]">arrow_downward</span>
            <h2 class="text-xs font-semibold uppercase tracking-wider">Total Income</h2>
          </div>
          <div class="text-lg sm:text-xl font-bold text-[#dae2fd] tabular-nums tracking-tight">
            ₹{{ formatAmount(totalIncome) }}
          </div>
        </section>

        <!-- Expense -->
        <section class="bg-[#131b2e] border border-[#31394d] rounded-lg p-4 flex-1 flex flex-col justify-between gap-1">
          <div class="flex items-center gap-1.5 text-[#ccc3d8]">
            <span class="material-symbols-outlined text-[16px] text-[#ffb4ab]">arrow_upward</span>
            <h2 class="text-xs font-semibold uppercase tracking-wider">Total Expense</h2>
          </div>
          <div class="text-lg sm:text-xl font-bold text-[#dae2fd] tabular-nums tracking-tight">
            ₹{{ formatAmount(totalExpenses) }}
          </div>
        </section>
      </div>
    </div>

    <!-- 2. SAVINGS BUCKETS BREAKDOWN (High Density Purpose Allocations Grid) -->
    <section class="bg-[#131b2e] border border-[#31394d] rounded-lg p-4 space-y-3">
      <div class="flex justify-between items-center border-b border-[#31394d] pb-2">
        <div class="flex items-center gap-2">
          <h2 class="text-sm font-bold text-[#dae2fd] tracking-tight">Savings Buckets</h2>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#7c3aed]/20 text-[#d2bbff] border border-[#7c3aed]/30">
            Purpose Allocations
          </span>
        </div>
      </div>

      <div v-if="activeBuckets.length === 0" class="text-center py-4 text-xs text-[#ccc3d8]">
        No active savings buckets configured. Go to Settings -> Savings Buckets to add custom buckets.
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        <div 
          v-for="bucket in activeBuckets" 
          :key="bucket.id"
          @click="$emit('add-transaction', { bucketId: bucket.id, type: 'expense' })"
          class="p-2.5 rounded-lg border border-[#31394d] bg-[#0b1326] hover:border-[#7c3aed] transition cursor-pointer flex flex-col justify-between space-y-2 min-h-[48px]"
          title="Click to manage transactions for this bucket"
        >
          <!-- Top Row: Icon, Name & Color Indicator -->
          <div class="flex items-center justify-between gap-1.5">
            <div class="flex items-center gap-1.5 overflow-hidden">
              <span class="w-6 h-6 rounded-md bg-[#131b2e] border border-[#31394d] flex items-center justify-center text-xs shrink-0">
                {{ bucket.icon || '🪣' }}
              </span>
              <div class="overflow-hidden">
                <p class="text-xs font-bold text-[#dae2fd] truncate">{{ bucket.name }}</p>
              </div>
            </div>
            <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: bucket.color || '#7c3aed' }"></span>
          </div>

          <!-- Middle Row: Allocated Balance -->
          <div class="pt-0.5">
            <span class="text-[10px] text-[#ccc3d8] block font-medium">Allocated Balance</span>
            <span class="text-xs sm:text-sm font-bold tracking-tight block truncate tabular-nums" :class="bucket.allocated_balance >= 0 ? 'text-[#4edea3]' : 'text-[#ffb4ab]'">
              ₹{{ formatAmount(bucket.allocated_balance) }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Expenses Breakdown & Storage Accounts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Category Breakdown Donut Chart -->
      <section class="lg:col-span-2 bg-[#131b2e] border border-[#31394d] rounded-lg p-4 space-y-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#31394d] pb-2.5">
          <div>
            <h2 class="text-sm font-bold text-[#dae2fd] tracking-tight">Expenses Breakdown</h2>
            <p class="text-xs text-[#ccc3d8]">Interactive category breakdown of expenses</p>
          </div>

          <!-- Time Horizon Filter Selector -->
          <div class="flex items-center gap-2 self-stretch sm:self-auto">
            <span class="text-xs text-[#ccc3d8] font-medium whitespace-nowrap">Period:</span>
            <select 
              v-model="dashboardTimeRange"
              class="px-2.5 py-1 bg-[#0b1326] border border-[#31394d] rounded-full text-[#dae2fd] text-xs font-medium focus:outline-none focus:border-[#7c3aed] transition cursor-pointer w-full sm:w-auto"
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
              <span class="text-[10px] font-semibold text-[#ccc3d8] uppercase tracking-wider">Total Spent</span>
              <span class="text-base font-bold text-[#dae2fd] tracking-tight tabular-nums">₹{{ formatAmount(totalFilteredCategoryExpense) }}</span>
            </div>
          </div>

          <!-- Category Legend & Percentage Breakdown -->
          <div class="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
            <div 
              v-for="cat in categoryLegendList" 
              :key="cat.name"
              class="flex items-center justify-between p-2 rounded-md bg-[#0b1326] border border-[#31394d] hover:border-[#7c3aed]/50 transition min-h-[48px]"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: cat.color }"></span>
                <span class="text-xs font-semibold text-[#dae2fd] truncate">{{ cat.name }}</span>
              </div>
              <div class="text-right shrink-0">
                <span class="text-xs font-bold text-[#dae2fd] tabular-nums">₹{{ formatAmount(cat.total) }}</span>
                <span class="text-[10px] text-[#ccc3d8] block font-normal tabular-nums">{{ cat.percentage }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-xs text-[#ccc3d8] border border-dashed border-[#31394d] rounded-lg">
          No expenses recorded for the selected time period.
        </div>
      </section>

      <!-- Storage Accounts Section -->
      <section class="bg-[#131b2e] border border-[#31394d] rounded-lg p-4 flex flex-col">
        <h2 class="text-sm font-bold text-[#dae2fd] tracking-tight mb-0.5">Storage Accounts</h2>
        <p class="text-xs text-[#ccc3d8] mb-3">Where physical cash/money is stored</p>
        <div v-if="accounts.length > 0" class="flex flex-col">
          <div 
            v-for="acc in accounts" 
            :key="acc.id"
            class="flex justify-between items-center py-2.5 border-b border-[#31394d]/40 last:border-0 hover:bg-[#171f33]/60 px-2 -mx-2 rounded transition-colors cursor-pointer min-h-[48px]"
          >
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-semibold text-[#dae2fd]">{{ acc.name }}</span>
              <span class="text-[10px] text-[#ccc3d8] bg-[#0b1326] border border-[#31394d] px-2 py-0.5 rounded w-max capitalize">{{ acc.type }}</span>
            </div>
            <span class="text-xs font-bold tabular-nums" :class="acc.balance >= 0 ? 'text-[#dae2fd]' : 'text-[#ffb4ab]'">
              ₹{{ formatAmount(acc.balance) }}
            </span>
          </div>
        </div>
        <div v-else class="text-center py-4 text-xs text-[#ccc3d8]">No accounts configured yet.</div>
      </section>
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
    ctx.strokeStyle = '#131b2e';
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
