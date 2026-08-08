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

        <!-- Interactive Donut Chart + Glow Legend Grid (Matching Screenshot) -->
        <div v-if="dashboardPiePaths.length > 0" class="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center py-2">
          
          <!-- Donut Chart SVG (Left Side) -->
          <div class="sm:col-span-6 flex items-center justify-center">
            <div class="relative w-60 h-60 flex items-center justify-center shrink-0">
              <svg class="w-full h-full overflow-visible" viewBox="-24 -24 248 248">
                <g
                  v-for="segment in dashboardPiePaths"
                  :key="segment.name"
                  class="cursor-pointer"
                  @mouseenter="hoveredCategoryIndex = segment.originalIndex"
                  @mouseleave="hoveredCategoryIndex = null"
                  @click="toggleSelectCategory(segment.originalIndex)"
                >
                  <!-- Expanded Invisible Hit Target for Easy Clicking -->
                  <path
                    :d="segment.hitD"
                    fill="transparent"
                  />
                  <!-- Visible Thin Donut Ring Arc -->
                  <path
                    :d="segment.d"
                    :fill="segment.color"
                    class="transition-all duration-300 pointer-events-none"
                    :style="{
                      transformOrigin: '100px 100px',
                      filter: activeDashboardIndex === segment.originalIndex ? `drop-shadow(0 0 12px ${segment.color})` : 'none',
                      transform: activeDashboardIndex === segment.originalIndex ? 'scale(1.05)' : 'scale(1)',
                      opacity: activeDashboardIndex === null || activeDashboardIndex === segment.originalIndex ? 1 : 0.45
                    }"
                  />
                </g>
              </svg>

              <!-- Center Readout -->
              <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-3">
                <span class="text-xs font-semibold text-[#ccc3d8] truncate max-w-[130px]">
                  {{ activeHoveredCategoryInfo ? activeHoveredCategoryInfo.name : 'Expenses' }}
                </span>
                <div class="text-2xl font-bold text-[#dae2fd] tabular-nums tracking-tight mt-0.5">
                  <span class="text-base text-[#ccc3d8] font-bold">₹</span>{{ formatAmount(activeHoveredCategoryInfo ? activeHoveredCategoryInfo.amount : totalFilteredCategoryExpense) }}
                </div>
                <span v-if="activeHoveredCategoryInfo" class="text-xs font-bold text-[#4edea3] mt-0.5 px-2 py-0.5 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/20">
                  {{ activeHoveredCategoryInfo.percentage }}% of total
                </span>
              </div>
            </div>
          </div>

          <!-- Interactive Legend Cards Grid with FLIP Animation (Side-by-Side 2-Column Grid) -->
          <TransitionGroup 
            name="flip-list" 
            tag="div" 
            class="sm:col-span-6 grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1.5 pr-2"
          >
            <div 
              v-for="item in activeDashboardLegendItems"
              :key="item.name"
              @mouseenter="hoveredCategoryIndex = item.originalIndex"
              @mouseleave="hoveredCategoryIndex = null"
              @click="toggleSelectCategory(item.originalIndex)"
              class="p-2.5 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-1.5 hover:border-slate-400"
              :style="{
                borderColor: activeDashboardIndex === item.originalIndex ? item.color : '#31394d',
                backgroundColor: activeDashboardIndex === item.originalIndex ? '#131b2e' : '#0b1326',
                boxShadow: activeDashboardIndex === item.originalIndex 
                  ? `0 0 16px ${item.color}60, inset 0 0 12px ${item.color}15` 
                  : 'none'
              }"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span 
                  class="w-3 h-3 rounded-full shrink-0 transition-transform duration-200"
                  :style="{ 
                    backgroundColor: item.color,
                    boxShadow: activeDashboardIndex === item.originalIndex ? `0 0 8px ${item.color}` : 'none' 
                  }"
                ></span>
                <p class="text-xs font-bold text-[#dae2fd] truncate leading-tight min-w-0">{{ item.name }}</p>
              </div>
              <div class="flex items-center justify-between gap-1">
                <span class="text-[10px] text-[#ccc3d8] font-semibold">{{ item.percentage }}%</span>
                <span class="text-xs font-bold tabular-nums truncate" :style="{ color: activeDashboardIndex === item.originalIndex ? item.color : '#dae2fd' }">
                  ₹{{ formatAmount(item.amount) }}
                </span>
              </div>
            </div>
          </TransitionGroup>

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

const hoveredCategoryIndex = ref(null);
const selectedCategoryIndex = ref(null);

const activeDashboardIndex = computed(() => {
  return selectedCategoryIndex.value !== null ? selectedCategoryIndex.value : hoveredCategoryIndex.value;
});

const toggleSelectCategory = (idx) => {
  if (selectedCategoryIndex.value === idx) {
    selectedCategoryIndex.value = null;
    hoveredCategoryIndex.value = null;
  } else {
    selectedCategoryIndex.value = idx;
    hoveredCategoryIndex.value = idx;
  }
};

const activeHoveredCategoryInfo = computed(() => {
  const currentIdx = activeDashboardIndex.value;
  if (currentIdx !== null && dashboardPiePaths.value[currentIdx]) {
    return dashboardPiePaths.value[currentIdx];
  }
  return null;
});

const dashboardPiePaths = computed(() => {
  const total = totalFilteredCategoryExpense.value;
  if (!total || filteredCategoryExpenses.value.length === 0) return [];

  const cx = 100;
  const cy = 100;

  // Thin visual ring radii
  const outerR = 86;
  const innerR = 74; // Sleek 12px visual ring width!

  // Expanded invisible hit-target radii for easy clicking
  const hitOuterR = 98;
  const hitInnerR = 62; // Wide 36px hit target!

  let currentAngle = -Math.PI / 2;

  return filteredCategoryExpenses.value.map((item, idx) => {
    const fraction = item.total / total;
    const angleSpan = fraction * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleSpan;
    const percentage = Math.round((item.total / total) * 100);
    currentAngle = endAngle;

    const createArcPath = (oR, iR) => {
      const x1o = cx + oR * Math.cos(startAngle);
      const y1o = cy + oR * Math.sin(startAngle);
      const x2o = cx + oR * Math.cos(endAngle);
      const y2o = cy + oR * Math.sin(endAngle);

      const x1i = cx + iR * Math.cos(startAngle);
      const y1i = cy + iR * Math.sin(startAngle);
      const x2i = cx + iR * Math.cos(endAngle);
      const y2i = cy + iR * Math.sin(endAngle);

      const largeArc = angleSpan > Math.PI ? 1 : 0;

      return [
        `M ${x1o} ${y1o}`,
        `A ${oR} ${oR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
        `L ${x2i} ${y2i}`,
        `A ${iR} ${iR} 0 ${largeArc} 0 ${x1i} ${y1i}`,
        'Z'
      ].join(' ');
    };

    return {
      ...item,
      amount: item.total,
      percentage,
      d: createArcPath(outerR, innerR),
      hitD: createArcPath(hitOuterR, hitInnerR),
      originalIndex: idx
    };
  });
});

const activeDashboardLegendItems = computed(() => {
  const items = dashboardPiePaths.value;
  const currentIdx = activeDashboardIndex.value;
  if (currentIdx === null) {
    return items;
  }
  const selectedItem = items.find(it => it.originalIndex === currentIdx);
  if (!selectedItem) return items;

  const rest = items.filter(it => it.originalIndex !== currentIdx);
  return [selectedItem, ...rest];
});

const formatAmount = (val) => {
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
</script>

<style scoped>
.flip-list-move,
.flip-list-enter-active,
.flip-list-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
