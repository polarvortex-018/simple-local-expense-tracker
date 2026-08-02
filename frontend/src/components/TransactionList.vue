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

    <!-- Filters Section (Collapsible Choose Filters Drawer) -->
    <div v-if="showCategoryDropdown" class="fixed inset-0 z-10" @click="showCategoryDropdown = false"></div>

    <!-- Filters Trigger Bar -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2.5 flex-wrap">
        <button 
          @click="showFilterDrawer = !showFilterDrawer"
          class="px-4 py-2.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/60 hover:border-indigo-500 rounded-xl text-xs font-bold text-indigo-200 flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
        >
          <span>🔍 Choose Filters</span>
          <span v-if="activeFilterCount > 0" class="px-2 py-0.5 rounded-full text-[10px] bg-indigo-600 text-white font-bold">
            {{ activeFilterCount }}
          </span>
          <span class="text-[10px] text-slate-400 transition" :class="{ 'rotate-180': showFilterDrawer }">▼</span>
        </button>

        <!-- Active Filter Pills & Clear Button -->
        <button 
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-900/50 rounded-xl text-[11px] font-semibold text-rose-300 transition cursor-pointer flex items-center gap-1"
        >
          <span>Clear Filters</span>
          <span class="text-xs">✕</span>
        </button>
      </div>

      <span class="text-xs text-slate-400 font-medium">
        Showing <strong>{{ transactions.length }}</strong> transactions
      </span>
    </div>

    <!-- Collapsible Filter Drawer Panel -->
    <div v-if="showFilterDrawer" class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div class="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span>🔍</span> Filter & Search Controls
        </h3>
        <button @click="showFilterDrawer = false" class="text-xs text-indigo-400 hover:underline font-semibold cursor-pointer">
          Done ✕
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <span>{{ cat.icon || '🏷️' }} {{ cat.name }}</span>
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

      <div class="flex justify-end gap-3 pt-2 border-t border-slate-800">
        <button 
          v-if="hasActiveFilters"
          @click="clearFilters" 
          class="px-3.5 py-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
        >
          Clear All Filters
        </button>
        <button 
          @click="showFilterDrawer = false" 
          class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
        >
          Apply & Close
        </button>
      </div>
    </div>

    <!-- Filtered Category Spending Breakdown Pie Chart Widget -->
    <div v-if="categorySpending.length > 0" class="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div>
          <h3 class="text-base font-semibold text-slate-200">Filtered Expense Distribution</h3>
          <p class="text-xs text-slate-400">Category breakdown for currently displayed transactions</p>
        </div>
        <div class="text-right">
          <span class="text-xs text-slate-400">Total Filtered Spending: </span>
          <strong class="text-rose-400 text-sm font-bold">₹{{ formatAmount(totalFilteredExpenses) }}</strong>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <!-- SVG Donut Pie Chart -->
        <div class="md:col-span-5 flex flex-col items-center justify-center relative">
          <div class="relative w-52 h-52 flex items-center justify-center">
            <svg class="w-full h-full" viewBox="0 0 200 200">
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

            <!-- Center Text -->
            <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
              <template v-if="activeCategoryInfo">
                <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate max-w-[120px]">
                  {{ activeCategoryInfo.name }}
                </span>
                <span class="text-base font-bold text-slate-100 tracking-tight">
                  ₹{{ formatAmount(activeCategoryInfo.amount) }}
                </span>
                <span class="text-xs font-semibold text-indigo-400">
                  {{ activeCategoryInfo.percentage }}%
                </span>
              </template>
              <template v-else>
                <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Filtered Spent
                </span>
                <span class="text-sm font-bold text-slate-100 tracking-tight">
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
        <div class="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
              <span class="text-xs font-medium text-slate-200 truncate max-w-[100px]">{{ category.name }}</span>
            </div>
            <div class="text-right shrink-0">
              <span class="text-xs font-semibold text-slate-100">₹{{ formatAmount(category.amount) }}</span>
              <span class="text-[10px] text-slate-400 block font-normal">{{ category.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Card View (Visible on < sm) -->
    <div v-if="transactions.length > 0" class="sm:hidden space-y-3">
      <div 
        v-for="tx in transactions" 
        :key="tx.id" 
        class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2.5"
      >
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-2.5">
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 text-base shrink-0">
              {{ getBucketIcon(tx.bucket_id) }}
            </span>
            <div>
              <p class="text-sm font-bold text-slate-100 truncate max-w-[170px]">{{ tx.description || 'No description' }}</p>
              <p class="text-[11px] text-slate-400 font-mono mt-0.5">{{ formatDate(tx.date) }}</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span 
              class="text-sm font-bold block"
              :class="tx.transaction_type === 'income' ? 'text-emerald-400' : 'text-rose-400'"
            >
              {{ tx.transaction_type === 'income' ? '+' : '-' }}₹{{ formatAmount(tx.amount) }}
            </span>
            <span 
              class="inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider mt-0.5"
              :class="tx.transaction_type === 'income' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-rose-950 text-rose-400 border border-rose-800/40'"
            >
              {{ tx.transaction_type }}
            </span>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-800/60 text-xs">
          <div class="flex flex-wrap items-center gap-1.5">
            <!-- Category -->
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 text-[10px] border border-slate-800">
              <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: getCategoryColor(tx.category_id) }"></span>
              <span class="truncate max-w-[90px]">{{ getCategoryName(tx.category_id) }}</span>
            </span>

            <!-- Account -->
            <span class="px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 text-[10px] border border-slate-800">
              {{ getAccountName(tx.account_id) }}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 items-center">
            <button @click="$emit('edit-transaction', tx)" class="p-1 text-slate-400 hover:text-indigo-400 text-xs cursor-pointer" title="Edit">
              ✏️
            </button>
            <button @click="$emit('delete-transaction', tx.id)" class="p-1 text-slate-400 hover:text-rose-400 text-xs cursor-pointer" title="Delete">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop Table Section (Visible on >= sm) -->
    <div class="hidden sm:block bg-slate-900 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
      <div class="w-full overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/30">
              <th class="py-3 px-3 pl-5 whitespace-nowrap">Date</th>
              <th class="py-3 px-3">Description</th>
              <th class="py-3 px-3">Bucket (Purpose)</th>
              <th class="py-3 px-3">Account (Storage)</th>
              <th class="py-3 px-3">Category</th>
              <th class="py-3 px-3">Type</th>
              <th class="py-3 px-3 text-right">Amount</th>
              <th class="py-3 px-3 pr-5 text-center whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/50">
            <tr 
              v-for="tx in transactions" 
              :key="tx.id" 
              class="hover:bg-slate-950/20 transition duration-150"
            >
              <!-- Date -->
              <td class="py-2.5 px-3 pl-5 text-xs text-slate-300 whitespace-nowrap">
                {{ formatDate(tx.date) }}
              </td>

              <!-- Description & Notes -->
              <td class="py-2.5 px-3 text-xs">
                <p class="font-medium text-slate-200 truncate max-w-[140px] xl:max-w-xs" :title="tx.description">{{ tx.description }}</p>
                <p v-if="tx.notes" class="text-[10px] text-slate-500 truncate max-w-[140px] xl:max-w-xs mt-0.5" :title="tx.notes">{{ tx.notes }}</p>
              </td>

              <!-- Bucket Badge -->
              <td class="py-2.5 px-3 text-xs whitespace-nowrap">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-900/40 text-[11px]">
                  <span>{{ getBucketIcon(tx.bucket_id) }}</span>
                  <span class="font-medium truncate max-w-[90px]">{{ getBucketName(tx.bucket_id) }}</span>
                </span>
              </td>

              <!-- Account -->
              <td class="py-2.5 px-3 text-xs text-slate-400 whitespace-nowrap">
                <span class="truncate max-w-[80px] block">{{ getAccountName(tx.account_id) }}</span>
              </td>

              <!-- Category -->
              <td class="py-2.5 px-3 text-xs whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 text-[11px] border border-slate-800">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: getCategoryColor(tx.category_id) }"></span>
                  <span class="truncate max-w-[85px]">{{ getCategoryName(tx.category_id) }}</span>
                </span>
              </td>

              <!-- Type -->
              <td class="py-2.5 px-3 text-xs whitespace-nowrap">
                <span 
                  class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  :class="tx.transaction_type === 'income' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/30' : 'bg-rose-950/80 text-rose-400 border border-rose-800/30'"
                >
                  {{ tx.transaction_type === 'income' ? 'Income' : 'Expense' }}
                </span>
              </td>

              <!-- Amount -->
              <td 
                class="py-2.5 px-3 text-right text-xs font-bold whitespace-nowrap"
                :class="tx.transaction_type === 'income' ? 'text-emerald-400' : 'text-slate-200'"
              >
                {{ tx.transaction_type === 'income' ? '+' : '-' }}₹{{ formatAmount(tx.amount) }}
              </td>

              <!-- Actions -->
              <td class="py-2.5 px-3 pr-5 text-center whitespace-nowrap">
                <div class="flex justify-center items-center gap-2">
                  <button 
                    @click="$emit('edit-transaction', tx)"
                    class="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                  >
                    Edit
                  </button>
                  <button 
                    @click="confirmDelete(tx)"
                    class="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition cursor-pointer shrink-0"
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
const hoveredIndex = ref(null);

const applyCustomDates = () => {
  filters.value.start_date = startDateInput.value;
  filters.value.end_date = endDateInput.value;
  emitFilters();
};

const showCategoryDropdown = ref(false);
const showFilterDrawer = ref(false);

const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.value.search) count++;
  if (filters.value.bucket_id) count++;
  if (filters.value.account_id) count++;
  if (filters.value.category_ids && filters.value.category_ids.length > 0) count++;
  if (filters.value.transaction_type) count++;
  if (filters.value.time_range) count++;
  return count;
});

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

// Filtered Category Breakdown computation based on active transactions
const categorySpending = computed(() => {
  const expenseTransactions = props.transactions.filter(t => t.transaction_type === 'expense');
  const totalExp = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  if (totalExp === 0) return [];

  const groupings = {};
  expenseTransactions.forEach(t => {
    groupings[t.category_id] = (groupings[t.category_id] || 0) + Number(t.amount);
  });

  const results = Object.entries(groupings).map(([catId, amount], idx) => {
    const category = props.categories.find(c => c.id === catId);
    return {
      id: catId,
      name: category ? category.name : 'Uncategorized',
      color: category ? category.color : '#6366f1',
      amount,
      percentage: Math.round((amount / totalExp) * 100),
      index: idx
    };
  });

  return results.sort((a, b) => b.amount - a.amount);
});

const totalFilteredExpenses = computed(() => {
  return props.transactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
});

// SVG Path-Arc calculation for filtered pie chart
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
