<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
      <div>
        <h2 class="text-xl font-bold text-[#f1f0f5] tracking-tight">Financial Overview</h2>
        <p class="text-xs text-[#9e9cae]">Real-time summary of your accounts, income, expenses, and savings buckets.</p>
      </div>
    </div>

    <!-- 1. Net Worth & Income/Expense Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <!-- Net Worth Card (Flat, no gradient) -->
      <section class="bg-[#14141d] border border-[#29293a]/70 rounded-xl p-3.5 flex flex-col gap-1 shadow-none">
        <div class="flex justify-between items-center">
          <h2 class="text-xs font-semibold text-[#9e9cae] uppercase tracking-wider">Net Worth</h2>
        </div>
        <div class="text-2xl font-semibold tabular-nums tracking-tight" :class="netWorth >= 0 ? 'text-[#f1f0f5]' : 'text-[#FFD1B3]'">
          ₹{{ formatAmount(netWorth) }}
        </div>
      </section>

      <!-- Income & Expense Summary Side-by-Side Cards -->
      <div class="flex gap-3 col-span-1 md:col-span-1 lg:col-span-2">
        <!-- Income Card -->
        <section class="bg-[#14141d] border border-[#29293a] rounded-xl p-4 flex-1 flex flex-col justify-between gap-1 shadow-sm">
          <div class="flex items-center gap-1.5 text-[#9e9cae]">
            <span class="text-sm">📉</span>
            <h2 class="text-xs font-semibold uppercase tracking-wider">Total Income</h2>
          </div>
          <div class="text-lg sm:text-xl font-semibold text-[#B3F5E1] tabular-nums tracking-tight">
            ₹{{ formatAmount(totalIncome) }}
          </div>
        </section>

        <!-- Expense Card -->
        <section class="bg-[#14141d] border border-[#29293a] rounded-xl p-4 flex-1 flex flex-col justify-between gap-1 shadow-sm">
          <div class="flex items-center gap-1.5 text-[#9e9cae]">
            <span class="text-sm">📈</span>
            <h2 class="text-xs font-semibold uppercase tracking-wider">Total Expense</h2>
          </div>
          <div class="text-lg sm:text-xl font-semibold text-[#FFD1B3] tabular-nums tracking-tight">
            ₹{{ formatAmount(totalExpenses) }}
          </div>
        </section>
      </div>
    </div>

    <!-- 2. SAVINGS ALLOCATIONS (Card Container with Horizontal Compact Grid) -->
    <section class="bg-[#14141d] border border-[#29293a] rounded-xl p-4 space-y-3 shadow-sm">
      <div class="flex justify-between items-center border-b border-[#29293a] pb-2">
        <h2 class="text-sm font-semibold text-[#f1f0f5] tracking-tight">Savings Allocations</h2>
      </div>

      <div v-if="activeBuckets.length === 0" class="py-4 text-center text-xs text-[#9e9cae]">
        No active savings buckets configured. Go to Settings -> Savings Buckets to add custom buckets.
      </div>

      <!-- Compact Horizontal Grid with Hairline Dividers -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 divide-x divide-y divide-[#29293a] border border-[#29293a] rounded-xl bg-[#0f0f15] overflow-hidden">
        <div 
          v-for="bucket in activeBuckets" 
          :key="bucket.id"
          @click="$emit('add-transaction', { bucketId: bucket.id, type: 'expense' })"
          class="p-2.5 sm:p-3 hover:bg-[#191924] transition cursor-pointer flex items-center gap-2.5 min-h-[50px]"
          title="Click to add transaction for this bucket"
        >
          <div class="w-8 h-8 rounded-lg bg-[#191924] border border-[#29293a] flex items-center justify-center text-sm shrink-0">
            {{ bucket.icon || '🪣' }}
          </div>
          <div class="overflow-hidden min-w-0 flex-1">
            <p class="text-xs font-semibold text-[#f1f0f5] truncate leading-tight">{{ bucket.name }}</p>
            <p class="text-xs sm:text-sm font-semibold tracking-tight tabular-nums truncate leading-tight" :class="Number(bucket.allocated_balance) >= 0 ? 'text-[#B3F5E1]' : 'text-[#FFD1B3]'">
              ₹{{ formatAmount(bucket.allocated_balance) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Current Month Expenses Breakdown Section Card -->
    <section class="bg-[#14141d] border border-[#29293a] rounded-xl p-4 space-y-4 shadow-sm">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#29293a] pb-2.5">
        <div>
          <h2 class="text-sm font-semibold text-[#f1f0f5] tracking-tight">Current Month Expenses Breakdown</h2>
          <p class="text-xs text-[#9e9cae]">Interactive category breakdown of expenses for this month</p>
        </div>
        <div class="text-right">
          <span class="text-xs text-[#9e9cae]">Total Expenses: </span>
          <strong class="text-[#FFD1B3] text-xs font-semibold tabular-nums">₹{{ formatAmount(totalFilteredCategoryExpense) }}</strong>
        </div>
      </div>

      <div v-if="dashboardPiePaths.length === 0" class="p-8 text-center text-xs font-semibold text-[#9e9cae]">
        No expense records found for this month.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center py-2">
        <!-- Donut Chart SVG -->
        <div class="sm:col-span-6 flex items-center justify-center">
          <div class="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center shrink-0">
            <svg class="w-full h-full overflow-visible" viewBox="-30 -30 260 260">
              <g
                v-for="segment in dashboardPiePaths"
                :key="segment.name"
                class="cursor-pointer"
                @mouseenter="hoveredCategoryIndex = segment.originalIndex"
                @mouseleave="hoveredCategoryIndex = null"
                @click="toggleSelectCategory(segment.originalIndex)"
              >
                <path :d="segment.hitD" fill="transparent" />
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
              <span class="text-xs font-semibold text-[#9e9cae] truncate max-w-[130px]">
                {{ activeHoveredCategoryInfo ? activeHoveredCategoryInfo.name : 'Expenses' }}
              </span>
              <div class="text-xl sm:text-2xl font-bold text-[#f1f0f5] tabular-nums tracking-tight mt-0.5">
                <span class="text-sm text-[#9e9cae] font-bold">₹</span>{{ formatAmount(activeHoveredCategoryInfo ? activeHoveredCategoryInfo.amount : totalFilteredCategoryExpense) }}
              </div>
              <span v-if="activeHoveredCategoryInfo" class="text-xs font-bold text-[#B3F5E1] mt-0.5 px-2 py-0.5 rounded-full bg-[#B3F5E1]/10">
                {{ activeHoveredCategoryInfo.percentage }}% of total
              </span>
            </div>
          </div>
        </div>

        <!-- Interactive Legend List -->
        <TransitionGroup 
          name="flip-list" 
          tag="div" 
          class="sm:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 max-h-56 overflow-y-auto p-1"
        >
          <div 
            v-for="item in activeDashboardLegendItems"
            :key="item.name"
            @mouseenter="hoveredCategoryIndex = item.originalIndex"
            @mouseleave="hoveredCategoryIndex = null"
            @click="toggleSelectCategory(item.originalIndex)"
            class="flex items-center justify-between py-1.5 px-2 rounded-lg transition-all duration-200 cursor-pointer hover:bg-[#0f0f15]"
            :class="activeDashboardIndex === item.originalIndex ? 'bg-[#0f0f15]' : ''"
          >
            <!-- Left: Color dot + Category Name -->
            <div class="flex items-center gap-2 min-w-0">
              <span 
                class="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-200"
                :style="{ 
                  backgroundColor: item.color,
                  boxShadow: activeDashboardIndex === item.originalIndex ? `0 0 8px ${item.color}` : 'none' 
                }"
              ></span>
              <span class="text-xs font-bold text-[#f1f0f5] truncate leading-none">{{ item.name }}</span>
            </div>

            <!-- Right: Percentage + Amount -->
            <div class="flex items-center gap-2 shrink-0 tabular-nums">
              <span class="text-[10px] font-semibold text-[#9e9cae] bg-[#0f0f15] px-1.5 py-0.2 rounded border border-[#29293a]">{{ item.percentage }}%</span>
              <span class="text-xs font-bold" :style="{ color: activeDashboardIndex === item.originalIndex ? item.color : '#f1f0f5' }">
                ₹{{ formatAmount(item.amount) }}
              </span>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </section>

    <!-- 4. STORAGE ACCOUNTS BREAKDOWN (Card Container with Horizontal Compact Grid) -->
    <section class="bg-[#14141d] border border-[#29293a] rounded-xl p-4 space-y-3 shadow-sm">
      <div class="flex justify-between items-center border-b border-[#29293a] pb-2">
        <h2 class="text-sm font-bold text-[#f1f0f5] tracking-tight">Storage Accounts</h2>
        <span class="text-xs text-[#9e9cae] font-semibold">Real-time Balances</span>
      </div>

      <div v-if="accounts.length === 0" class="py-4 text-center text-xs text-[#9e9cae]">
        No storage accounts configured. Go to Settings -> Storage Accounts to add custom accounts.
      </div>

      <!-- Compact Horizontal Grid with Hairline Dividers -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 divide-x divide-y divide-[#29293a] border border-[#29293a] rounded-xl bg-[#0f0f15] overflow-hidden">
        <div 
          v-for="acc in accounts" 
          :key="acc.id"
          class="p-2.5 sm:p-3 hover:bg-[#191924] transition flex items-center justify-between gap-2 min-h-[50px]"
        >
          <div class="overflow-hidden min-w-0 flex-1">
            <p class="text-xs font-bold text-[#f1f0f5] truncate leading-tight">{{ acc.name }}</p>
            <p class="text-xs sm:text-sm font-bold tracking-tight tabular-nums truncate leading-tight" :class="Number(acc.balance) >= 0 ? 'text-[#B3F5E1]' : 'text-[#FFD1B3]'">
              ₹{{ formatAmount(acc.balance) }}
            </p>
          </div>
          <span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#191924] text-[#9e9cae] border border-[#29293a] shrink-0">
            {{ acc.account_type || 'Account' }}
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  transactions: {
    type: Array,
    default: () => []
  },
  accounts: {
    type: Array,
    default: () => []
  },
  categories: {
    type: Array,
    default: () => []
  },
  buckets: {
    type: Array,
    default: () => []
  }
});

defineEmits(['add-transaction']);

// Metrics
const netWorth = computed(() => {
  return props.accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
});

const currentMonthTransactions = computed(() => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  return props.transactions.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
});

const totalIncome = computed(() => {
  return currentMonthTransactions.value
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
});

const totalExpenses = computed(() => {
  return currentMonthTransactions.value
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
});

const activeBuckets = computed(() => props.buckets.filter(bucket => {
  if (bucket.is_archived) return false;
  return Number.isFinite(Number(bucket.allocated_balance));
}));

const filteredCategoryExpenses = computed(() => {
  const map = {};
  currentMonthTransactions.value.forEach(t => {
    if (t.transaction_type === 'expense') {
      const catName = t.category?.name || 'Uncategorized';
      const catColor = t.category?.color || '#ef4444';
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
  const outerR = 103;
  const innerR = 89;
  const hitOuterR = 118;
  const hitInnerR = 74;

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
  if (currentIdx === null) return items;
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
