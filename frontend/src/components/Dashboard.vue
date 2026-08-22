<template>
  <div class="space-y-6">
    <!-- 1. Header & Net Worth Overview Section (Flush, Hairline Dividers) -->
    <section class="space-y-3 pb-4 border-b border-[#1f202e]">
      <div>
        <h2 class="text-base font-bold text-[#f1f0f5] tracking-tight">Financial Overview</h2>
        <p class="text-xs text-[#9e9cae]">Real-time summary of your accounts, income, expenses, and savings buckets.</p>
      </div>

      <!-- Hero Net Worth Readout -->
      <div class="pt-1">
        <span class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">NET WORTH</span>
        <div class="text-3xl font-bold tabular-nums tracking-tight mt-0.5" :class="netWorth >= 0 ? 'text-[#f1f0f5]' : 'text-[#FFD1B3]'">
          ₹{{ formatAmount(netWorth) }}
        </div>
      </div>

      <!-- Side-by-Side Income & Expense Metrics Split 50/50 Down the Middle -->
      <div class="grid grid-cols-2 divide-x divide-[#1f202e] pt-3 mt-3 border-t border-[#1f202e]/60">
        <div class="flex items-center gap-2.5 pr-2.5 min-w-0">
          <div class="w-7 h-7 rounded-lg bg-[#B3F5E1]/10 border border-[#B3F5E1]/20 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-sm text-[#B3F5E1]">north_east</span>
          </div>
          <div class="min-w-0 flex-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-[#B3F5E1] block truncate">INCOME ({{ currentMonthLabel }})</span>
            <span class="text-sm font-bold text-[#B3F5E1] tabular-nums tracking-tight block truncate">₹{{ formatAmount(totalIncome) }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2.5 pl-3 min-w-0">
          <div class="w-7 h-7 rounded-lg bg-[#FFD1B3]/10 border border-[#FFD1B3]/20 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-sm text-[#FFD1B3]">south_east</span>
          </div>
          <div class="min-w-0 flex-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-[#FFD1B3] block truncate">EXPENSE ({{ currentMonthLabel }})</span>
            <span class="text-sm font-bold text-[#FFD1B3] tabular-nums tracking-tight block truncate">₹{{ formatAmount(totalExpenses) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. SAVINGS ALLOCATIONS (Hairline Dividers List / 2-Col Grid) -->
    <section class="space-y-2">
      <div class="px-0.5">
        <h3 class="text-sm font-bold text-[#f1f0f5] tracking-tight">Savings Allocations</h3>
      </div>

      <div v-if="activeBuckets.length === 0" class="py-6 text-center text-xs text-[#9e9cae] border-y border-[#1f202e]">
        No active savings buckets configured. Go to Settings → Savings Buckets to add buckets.
      </div>

      <!-- 2-Column Mobile-First Responsive Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div 
          v-for="bucket in activeBuckets" 
          :key="bucket.id"
          @click="$emit('add-transaction', { bucketId: bucket.id, type: 'expense' })"
          class="flex items-center gap-2.5 p-3 rounded-xl border border-[#1f202e] bg-[#0f1019] hover:bg-[#141520] hover:border-[#D4BFFF]/40 text-left transition cursor-pointer active:scale-[0.98] min-h-[52px]"
          title="Click to add transaction for this bucket"
        >
          <div class="w-8 h-8 rounded-lg bg-[#141520] border border-[#1f202e] flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-base leading-none" :style="{ color: bucket.color || '#D4BFFF' }">{{ resolveIcon(bucket.icon, 'savings') }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-bold text-[#f1f0f5] truncate">{{ bucket.name }}</p>
            <p class="text-[10px] font-bold tabular-nums truncate mt-0.5" :class="Number(bucket.allocated_balance) >= 0 ? 'text-[#D4BFFF]' : 'text-[#FFD1B3]'">
              ₹{{ formatAmount(bucket.allocated_balance) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Current Month Expenses Breakdown (Hairline Divided Section) -->
    <section class="space-y-3 pt-2">
      <div class="border-b border-[#1f202e] pb-2 px-0.5">
        <h3 class="text-sm font-bold text-[#f1f0f5] tracking-tight">Expenses Breakdown ({{ currentMonthLabel }})</h3>
      </div>

      <div v-if="dashboardPiePaths.length === 0" class="py-8 text-center text-xs font-medium text-[#9e9cae]">
        No expense records found for this month.
      </div>

      <div v-else class="space-y-4 py-1">
        <!-- Donut Chart SVG -->
        <div class="flex items-center justify-center py-2">
          <div class="relative w-56 h-56 flex items-center justify-center shrink-0">
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
                    filter: activeDashboardIndex === segment.originalIndex ? `drop-shadow(0 0 10px ${segment.color})` : 'none',
                    transform: activeDashboardIndex === segment.originalIndex ? 'scale(1.04)' : 'scale(1)',
                    opacity: activeDashboardIndex === null || activeDashboardIndex === segment.originalIndex ? 1 : 0.4
                  }"
                />
              </g>
            </svg>

            <!-- Center Readout -->
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-3">
              <span class="text-[11px] font-semibold text-[#9e9cae] uppercase tracking-wider truncate max-w-[120px]">
                {{ activeHoveredCategoryInfo ? activeHoveredCategoryInfo.name : 'Total' }}
              </span>
              <div class="text-xl font-bold text-[#f1f0f5] tabular-nums tracking-tight mt-0.5">
                ₹{{ formatAmount(activeHoveredCategoryInfo ? activeHoveredCategoryInfo.amount : totalFilteredCategoryExpense) }}
              </div>
              <span v-if="activeHoveredCategoryInfo" class="text-[10px] font-semibold text-[#B3F5E1] mt-0.5">
                {{ activeHoveredCategoryInfo.percentage }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Hairline Divided Legend List -->
        <TransitionGroup 
          name="flip-list" 
          tag="div" 
          class="border-y border-[#1f202e] divide-y divide-[#1f202e]"
        >
          <div 
            v-for="item in activeDashboardLegendItems"
            :key="item.name"
            @mouseenter="hoveredCategoryIndex = item.originalIndex"
            @mouseleave="hoveredCategoryIndex = null"
            @click="toggleSelectCategory(item.originalIndex)"
            class="flex items-center justify-between py-2.5 px-1 transition cursor-pointer hover:bg-[#141520] active:bg-[#141520]"
            :class="activeDashboardIndex === item.originalIndex ? 'bg-[#141520]' : ''"
          >
            <!-- Left: Color Indicator Dot + Category Name -->
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: item.color }"></span>
              <span class="text-xs font-semibold text-[#f1f0f5] truncate">{{ item.name }}</span>
            </div>

            <!-- Right: Percentage + Amount -->
            <div class="flex items-center gap-4 shrink-0 tabular-nums">
              <span class="text-[11px] text-[#9e9cae] font-medium w-10 text-right">{{ item.percentage }}%</span>
              <span class="text-xs font-bold text-[#f1f0f5] text-right min-w-[70px]">
                ₹{{ formatAmount(item.amount) }}
              </span>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </section>

    <!-- 4. STORAGE ACCOUNTS BREAKDOWN (Hairline Divider Section) -->
    <section class="space-y-2 pt-2">
      <div class="flex justify-between items-center border-b border-[#1f202e] pb-2 px-0.5">
        <h3 class="text-sm font-bold text-[#f1f0f5] tracking-tight">Storage Accounts</h3>
        <span class="text-[10px] font-semibold text-[#9e9cae] uppercase tracking-wider">Real-time Balances</span>
      </div>

      <div v-if="physicalAccounts.length === 0" class="py-6 text-center text-xs text-[#9e9cae] border-y border-[#1f202e]">
        No storage accounts configured. Go to Settings → Storage Accounts to add accounts.
      </div>

      <!-- Hairline Divided Accounts List -->
      <div v-else class="border-y border-[#1f202e] divide-y divide-[#1f202e]">
        <div 
          v-for="acc in physicalAccounts" 
          :key="acc.id"
          class="py-3 px-1 flex items-center justify-between gap-2 hover:bg-[#141520] transition"
        >
          <div class="overflow-hidden min-w-0 flex-1">
            <p class="text-xs font-semibold text-[#f1f0f5] truncate leading-tight">{{ acc.name }}</p>
            <p class="text-xs font-bold tracking-tight tabular-nums truncate leading-tight mt-0.5" :class="Number(acc.balance) >= 0 ? 'text-[#B3F5E1]' : 'text-[#FFD1B3]'">
              ₹{{ formatAmount(acc.balance) }}
            </p>
          </div>
          <span class="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-[#1f202e] text-[#9e9cae] shrink-0">
            {{ acc.account_type || 'ACCOUNT' }}
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { resolveIcon } from '../utils/iconResolver.js';

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
const physicalAccounts = computed(() => {
  return props.accounts.filter(acc => acc.type !== 'Unassigned' && acc.id !== 'acc_unassigned_pool');
});

const currentMonthLabel = computed(() => {
  return new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
});

const netWorth = computed(() => {
  return physicalAccounts.value.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
});

const currentMonthTransactions = computed(() => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  return props.transactions.filter(t => {
    if (!t.date) return false;
    if (t.account_id === 'acc_unassigned_pool') return false;
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
});

const filteredCategoryExpenses = computed(() => {
  const map = {};
  currentMonthTransactions.value.forEach(t => {
    if (t.transaction_type !== 'expense') return;
    const category = props.categories.find(c => c.id === t.category_id) || t.category;
    const catName = category ? category.name : 'Uncategorized';
    const catColor = category?.color || '#ef4444';
    const catIcon = category?.icon || 'category';
    const amt = Number(t.amount) || 0;
    if (!map[catName]) {
      map[catName] = { id: category?.id || null, name: catName, color: catColor, icon: catIcon, total: 0 };
    }
    map[catName].total += amt;
  });

  return Object.values(map).sort((a, b) => b.total - a.total);
});

const totalExpenses = computed(() => {
  return filteredCategoryExpenses.value.reduce((sum, c) => sum + c.total, 0);
});

const totalFilteredCategoryExpense = totalExpenses;

const filteredCategoryIncome = computed(() => {
  const map = {};
  currentMonthTransactions.value.forEach(t => {
    if (t.transaction_type !== 'income') return;
    const category = props.categories.find(c => c.id === t.category_id) || t.category;
    const catName = category ? category.name : 'Uncategorized';
    const catColor = category?.color || '#10b981';
    const catIcon = category?.icon || 'category';
    const amt = Number(t.amount) || 0;
    if (!map[catName]) {
      map[catName] = { id: category?.id || null, name: catName, color: catColor, icon: catIcon, total: 0 };
    }
    map[catName].total += amt;
  });

  return Object.values(map).sort((a, b) => b.total - a.total);
});

const totalIncome = computed(() => {
  return filteredCategoryIncome.value.reduce((sum, c) => sum + c.total, 0);
});

const activeBuckets = computed(() => props.buckets.filter(bucket => {
  if (bucket.is_archived) return false;
  return Number.isFinite(Number(bucket.allocated_balance));
}));

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
  transition: transform 0.22s var(--ease-out), opacity 0.22s var(--ease-out);
}
</style>
