<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-xl font-bold text-[#dae2fd] tracking-tight">Transactions</h2>
        <p class="text-xs text-[#ccc3d8]">Search and filter complete transaction history.</p>
      </div>
    </div>

    <!-- Filters Section (Collapsible Choose Filters Drawer) -->
    <div v-if="showCategoryDropdown" class="fixed inset-0 z-10" @click="showCategoryDropdown = false"></div>

    <!-- Filters Trigger Bar -->
    <div class="bg-[#131b2e] border border-[#31394d] rounded-xl p-2.5 shadow-sm flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2 flex-wrap">
        <button 
          @click="showFilterDrawer = !showFilterDrawer"
          class="h-8 px-3 bg-[#0b1326] hover:bg-[#1a243b] border border-[#31394d] hover:border-[#7c3aed] rounded-lg text-xs font-bold text-[#d2bbff] flex items-center gap-1.5 transition cursor-pointer"
        >
          <span>🔍 Choose Filters</span>
          <span v-if="activeFilterCount > 0" class="px-1.5 py-0.5 rounded-full text-[10px] bg-[#7c3aed] text-white font-bold">
            {{ activeFilterCount }}
          </span>
          <span class="text-[10px] text-[#ccc3d8] transition" :class="{ 'rotate-180': showFilterDrawer }">▼</span>
        </button>

        <!-- Active Filter Pills & Clear Button -->
        <button 
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="h-8 px-2.5 bg-[#ffb4ab]/10 hover:bg-[#ffb4ab]/20 border border-[#ffb4ab]/30 rounded-lg text-xs font-bold text-[#ffb4ab] transition cursor-pointer flex items-center gap-1"
        >
          <span>Clear Filters</span>
          <span class="text-xs">✕</span>
        </button>
      </div>

      <span class="text-xs text-[#ccc3d8] font-medium">
        Showing <strong>{{ displayedTransactions.length }}</strong> of <strong>{{ summary.total_count }}</strong>
      </span>
    </div>

    <!-- Collapsible Filter Drawer Panel -->
    <div v-if="showFilterDrawer" class="bg-[#131b2e] border border-[#31394d] rounded-xl p-3.5 shadow-sm space-y-3">
      <div class="flex justify-between items-center border-b border-[#31394d] pb-2">
        <h3 class="text-xs font-bold text-[#dae2fd] uppercase tracking-wider flex items-center gap-1.5">
          <span>🔍</span> Filter & Search Controls
        </h3>
        <button @click="showFilterDrawer = false" class="text-xs text-[#7c3aed] hover:underline font-bold cursor-pointer">
          Done ✕
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <!-- Search Input -->
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Search</label>
          <input 
            v-model="filters.search"
            @input="debounceFetch"
            type="text" 
            placeholder="Search description/notes..."
            class="w-full h-8 px-2.5 bg-[#0b1326] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-[#dae2fd] text-xs placeholder-[#ccc3d8]/50 focus:outline-none transition"
          />
        </div>

        <!-- Bucket Filter -->
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Savings Bucket</label>
          <select 
            v-model="filters.bucket_id" 
            @change="emitFilters"
            class="w-full h-8 px-2.5 bg-[#0b1326] border border-[#31394d] hover:bg-[#131b2e] focus:border-[#7c3aed] rounded-lg text-[#dae2fd] text-xs focus:outline-none transition cursor-pointer"
          >
            <option value="" class="bg-[#0b1326] text-[#ccc3d8]">All Buckets</option>
            <option v-for="b in buckets" :key="b.id" :value="b.id" class="bg-[#0b1326] text-[#dae2fd]">
              {{ b.icon || '🪣' }} {{ b.name }}
            </option>
          </select>
        </div>

        <!-- Account Filter -->
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Account</label>
          <select 
            v-model="filters.account_id" 
            @change="emitFilters"
            class="w-full h-8 px-2.5 bg-[#0b1326] border border-[#31394d] hover:bg-[#131b2e] focus:border-[#7c3aed] rounded-lg text-[#dae2fd] text-xs focus:outline-none transition cursor-pointer"
          >
            <option value="" class="bg-[#0b1326] text-[#ccc3d8]">All Accounts</option>
            <option v-for="acc in accounts" :key="acc.id" :value="acc.id" class="bg-[#0b1326] text-[#dae2fd]">{{ acc.name }}</option>
          </select>
        </div>

        <!-- Category Filter (Multi-select) -->
        <div class="space-y-1 relative z-20">
          <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Categories</label>
          <button 
            type="button"
            @click="showCategoryDropdown = !showCategoryDropdown"
            class="w-full h-8 px-2.5 bg-[#0b1326] border border-[#31394d] hover:bg-[#131b2e] focus:border-[#7c3aed] rounded-lg text-[#dae2fd] text-xs focus:outline-none transition text-left flex justify-between items-center cursor-pointer"
          >
            <span class="truncate">{{ selectedCategoryNames }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-[#ccc3d8] transition" :class="{ 'rotate-180': showCategoryDropdown }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div 
            v-if="showCategoryDropdown" 
            class="absolute left-0 right-0 mt-1 p-2 bg-[#0b1326] border border-[#31394d] rounded-xl shadow-xl max-h-56 overflow-y-auto space-y-1"
          >
            <label class="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-[#131b2e] cursor-pointer text-xs text-[#dae2fd] transition">
              <input 
                type="checkbox"
                :checked="filters.category_ids.length === 0"
                @change="clearCategorySelection"
                class="rounded border-[#31394d] text-[#7c3aed] focus:ring-[#7c3aed] bg-[#131b2e] cursor-pointer"
              />
              <span>All Categories</span>
            </label>
            <hr class="border-[#31394d] my-1" />
            <label 
              v-for="cat in categories" 
              :key="cat.id"
              class="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-[#131b2e] cursor-pointer text-xs text-[#dae2fd] transition"
            >
              <input 
                type="checkbox"
                :value="cat.id"
                v-model="filters.category_ids"
                @change="emitFilters"
                class="rounded border-[#31394d] text-[#7c3aed] focus:ring-[#7c3aed] bg-[#131b2e] cursor-pointer"
              />
              <span>{{ cat.icon || '🏷️' }} {{ cat.name }}</span>
            </label>
          </div>
        </div>

        <!-- Type Filter -->
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Type</label>
          <select 
            v-model="filters.transaction_type" 
            @change="emitFilters"
            class="w-full h-8 px-2.5 bg-[#0b1326] border border-[#31394d] hover:bg-[#131b2e] focus:border-[#7c3aed] rounded-lg text-[#dae2fd] text-xs focus:outline-none transition cursor-pointer"
          >
            <option value="" class="bg-[#0b1326] text-[#ccc3d8]">All Types</option>
            <option value="income" class="bg-[#0b1326] text-[#dae2fd]">Income</option>
            <option value="expense" class="bg-[#0b1326] text-[#dae2fd]">Expense</option>
            <option value="adjustment" class="bg-[#0b1326] text-[#dae2fd]">Adjustment</option>
          </select>
        </div>

        <!-- Date Range Filter -->
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Date Range</label>
          <select 
            v-model="filters.time_range" 
            @change="emitFilters"
            class="w-full h-8 px-2.5 bg-[#0b1326] border border-[#31394d] hover:bg-[#131b2e] focus:border-[#7c3aed] rounded-lg text-[#dae2fd] text-xs focus:outline-none transition cursor-pointer"
          >
            <option value="" class="bg-[#0b1326] text-[#ccc3d8]">All Time</option>
            <option value="this_month" class="bg-[#0b1326] text-[#dae2fd]">This Month</option>
            <option value="last_month" class="bg-[#0b1326] text-[#dae2fd]">Last Month</option>
            <option value="last_3_months" class="bg-[#0b1326] text-[#dae2fd]">Last 3 Months</option>
            <option value="last_6_months" class="bg-[#0b1326] text-[#dae2fd]">Last 6 Months</option>
            <option value="this_year" class="bg-[#0b1326] text-[#dae2fd]">This Year</option>
            <option value="custom" class="bg-[#0b1326] text-[#dae2fd]">Custom Range</option>
          </select>
        </div>
      </div>

      <!-- Custom Date Inputs -->
      <div v-if="filters.time_range === 'custom'" class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#31394d]">
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Start Date</label>
          <input 
            v-model="startDateInput"
            @blur="applyCustomDates"
            @change="applyCustomDates"
            @click="$event.target.showPicker?.()"
            type="date"
            class="w-full h-8 px-2.5 bg-[#0b1326] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-[#dae2fd] text-xs focus:outline-none transition cursor-pointer [color-scheme:dark]"
          />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">End Date</label>
          <input 
            v-model="endDateInput"
            @blur="applyCustomDates"
            @change="applyCustomDates"
            @click="$event.target.showPicker?.()"
            type="date"
            class="w-full h-8 px-2.5 bg-[#0b1326] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-[#dae2fd] text-xs focus:outline-none transition cursor-pointer [color-scheme:dark]"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2 border-t border-[#31394d]">
        <button 
          v-if="hasActiveFilters"
          @click="clearFilters" 
          class="px-3 h-8 text-xs font-bold text-[#ffb4ab] hover:underline transition cursor-pointer"
        >
          Clear All Filters
        </button>
        <button 
          @click="showFilterDrawer = false" 
          class="px-3.5 h-8 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-md"
        >
          Apply & Close
        </button>
      </div>
    </div>

    <!-- Filtered Category Spending Breakdown Pie Chart Widget -->
    <div v-if="categorySpending.length > 0" class="bg-[#131b2e] border border-[#31394d] rounded-lg p-4 shadow-sm space-y-3">
      <div class="flex items-center justify-between border-b border-[#31394d] pb-2.5">
        <div>
          <h3 class="text-sm font-bold text-[#dae2fd] tracking-tight">Filtered Expense Distribution</h3>
          <p class="text-xs text-[#ccc3d8]">Category breakdown for currently displayed transactions</p>
        </div>
        <div class="text-right">
          <span class="text-xs text-[#ccc3d8]">Total Filtered Spending: </span>
          <strong class="text-[#ffb4ab] text-xs font-bold tabular-nums">₹{{ formatAmount(totalFilteredExpenses) }}</strong>
        </div>
      </div>

      <!-- Interactive Donut Chart + Glow Legend Grid (Matching Screenshot) -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-2">
        
        <!-- Donut Chart SVG (Left Side) -->
        <div class="md:col-span-6 flex items-center justify-center">
          <div class="relative w-60 h-60 flex items-center justify-center shrink-0">
            <svg class="w-full h-full overflow-visible" viewBox="-24 -24 248 248">
              <g
                v-for="segment in piePaths"
                :key="segment.id"
                class="cursor-pointer"
                @mouseenter="hoveredIndex = segment.originalIndex"
                @mouseleave="hoveredIndex = null"
                @click="toggleSelectIndex(segment)"
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
                    filter: activeIndex === segment.originalIndex ? `drop-shadow(0 0 12px ${segment.color})` : 'none',
                    transform: activeIndex === segment.originalIndex ? 'scale(1.05)' : 'scale(1)',
                    opacity: activeIndex === null || activeIndex === segment.originalIndex ? 1 : 0.45
                  }"
                />
              </g>
            </svg>

            <!-- Center Readout -->
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-3">
              <span class="text-xs font-semibold text-[#ccc3d8] truncate max-w-[130px]">
                {{ activeCategoryInfo ? activeCategoryInfo.name : 'Expenses' }}
              </span>
              <div class="text-2xl font-bold text-[#dae2fd] tabular-nums tracking-tight mt-0.5">
                <span class="text-base text-[#ccc3d8] font-bold">₹</span>{{ formatAmount(activeCategoryInfo ? activeCategoryInfo.amount : totalFilteredExpenses) }}
              </div>
              <span v-if="activeCategoryInfo" class="text-xs font-bold text-[#4edea3] mt-0.5 px-2 py-0.5 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/20">
                {{ activeCategoryInfo.percentage }}% of total
              </span>
            </div>
          </div>
        </div>

        <!-- Interactive Legend Cards Grid with FLIP Animation (Side-by-Side 2-Column Grid) -->
        <TransitionGroup 
          name="flip-list" 
          tag="div" 
          class="md:col-span-6 grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1.5 pr-2"
        >
          <div 
            v-for="item in activeLegendItems"
            :key="item.id"
            @mouseenter="hoveredIndex = item.originalIndex"
            @mouseleave="hoveredIndex = null"
            @click="toggleSelectIndex(item)"
            class="p-2.5 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-1.5 hover:border-slate-400"
            :style="{
              borderColor: activeIndex === item.originalIndex ? item.color : '#31394d',
              backgroundColor: activeIndex === item.originalIndex ? '#131b2e' : '#0b1326',
              boxShadow: activeIndex === item.originalIndex 
                ? `0 0 16px ${item.color}60, inset 0 0 12px ${item.color}15` 
                : 'none'
            }"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span 
                class="w-3 h-3 rounded-full shrink-0 transition-transform duration-200"
                :style="{ 
                  backgroundColor: item.color,
                  boxShadow: activeIndex === item.originalIndex ? `0 0 8px ${item.color}` : 'none' 
                }"
              ></span>
              <p class="text-xs font-bold text-[#dae2fd] truncate leading-tight min-w-0">{{ item.name }}</p>
            </div>
            <div class="flex items-center justify-between gap-1">
              <span class="text-[10px] text-[#ccc3d8] font-semibold">{{ item.percentage }}%</span>
              <span class="text-xs font-bold tabular-nums truncate" :style="{ color: activeIndex === item.originalIndex ? item.color : '#dae2fd' }">
                ₹{{ formatAmount(item.amount) }}
              </span>
            </div>
          </div>
        </TransitionGroup>

      </div>
    </div>

    <!-- Mobile Card View (Visible on < sm screens) -->
    <div v-if="displayedTransactions.length > 0" class="sm:hidden space-y-2">
      <div 
        v-for="tx in displayedTransactions" 
        :key="tx.id" 
        @click="viewTransactionDetails(tx)"
        class="bg-[#131b2e] border border-[#31394d] hover:border-[#7c3aed]/60 rounded-xl p-3 shadow-sm space-y-2 min-h-[48px] flex flex-col justify-between cursor-pointer transition-all active:scale-[0.99]"
      >
        <div class="flex justify-between items-start gap-2">
          <div class="flex items-start gap-2 min-w-0">
            <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#0b1326] border border-[#31394d] text-sm shrink-0 mt-0.5">
              {{ getBucketIcon(tx.bucket_id) }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-bold text-[#dae2fd] break-words leading-snug">{{ tx.description || 'No description' }}</p>
              <p class="text-[10px] text-[#ccc3d8] font-mono mt-0.5">{{ formatDate(tx.date) }}</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span 
              class="text-xs font-bold block tabular-nums"
              :class="transactionAmountClass(tx)"
            >
              {{ transactionSign(tx) }}₹{{ formatAmount(tx.amount) }}
            </span>
            <span 
              class="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mt-0.5"
              :class="transactionBadgeClass(tx)"
            >
              {{ transactionLabel(tx) }}
            </span>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#31394d]/40 text-xs">
          <div class="flex flex-wrap items-center gap-1.5 min-w-0">
            <!-- Category -->
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#0b1326] text-[#dae2fd] text-[10px] font-semibold border border-[#31394d]">
              <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: getCategoryColor(tx.category_id) }"></span>
              <span>{{ getCategoryName(tx.category_id) }}</span>
            </span>

            <!-- Account -->
            <span class="px-1.5 py-0.5 rounded-md bg-[#0b1326] text-[#ccc3d8] text-[10px] font-medium border border-[#31394d]">
              {{ getAccountName(tx.account_id) }}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 items-center shrink-0 ml-auto">
            <button @click.stop="$emit('edit-transaction', tx)" class="p-1 text-[#d2bbff] hover:text-white text-xs cursor-pointer" title="Edit">
              ✏️
            </button>
            <button @click.stop="confirmDelete(tx)" class="p-1 text-[#ffb4ab] hover:text-rose-300 text-xs cursor-pointer" title="Delete">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Pagination -->
    <div class="sm:hidden sticky bottom-20 z-20 flex items-center justify-between gap-3 rounded-xl border border-[#31394d] bg-[#131b2e]/98 p-2.5 shadow-lg backdrop-blur-md">
      <button
        @click="prevPage"
        :disabled="page === 1"
        class="min-h-[40px] flex-1 rounded-lg border border-[#31394d] bg-[#0b1326] px-3 py-1.5 text-xs font-bold text-[#dae2fd] disabled:opacity-35 cursor-pointer"
      >
        Previous
      </button>
      <div class="shrink-0 text-center">
        <p class="text-xs font-bold text-[#dae2fd]">Page {{ page }}</p>
        <p class="text-[10px] text-[#ccc3d8]">{{ Math.min(page * limit, summary.total_count) }} of {{ summary.total_count }}</p>
      </div>
      <button
        @click="nextPage"
        :disabled="page * limit >= summary.total_count"
        class="min-h-[40px] flex-1 rounded-lg bg-[#7c3aed] px-3 py-1.5 text-xs font-bold text-white disabled:bg-[#31394d] disabled:text-[#ccc3d8] cursor-pointer"
      >
        Next
      </button>
    </div>

    <!-- Desktop Table Section (Visible on >= sm) -->
    <div class="hidden sm:block bg-[#131b2e] border border-[#31394d] rounded-xl shadow-sm overflow-hidden">
      <div class="w-full overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="border-b border-[#31394d] text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider bg-[#0b1326]">
              <th class="py-2.5 px-3 pl-4 whitespace-nowrap">Date</th>
              <th class="py-2.5 px-3">Description</th>
              <th class="py-2.5 px-3">Bucket</th>
              <th class="py-2.5 px-3">Account</th>
              <th class="py-2.5 px-3">Category</th>
              <th class="py-2.5 px-3">Type</th>
              <th class="py-2.5 px-3 text-right">Amount</th>
              <th class="py-2.5 px-3 pr-4 text-center whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#31394d]/40">
            <tr 
              v-for="tx in displayedTransactions" 
              :key="tx.id" 
              @click="viewTransactionDetails(tx)"
              class="hover:bg-[#171f33]/90 transition cursor-pointer min-h-[44px]"
            >
              <!-- Date -->
              <td class="py-2.5 px-3 pl-4 text-xs text-[#ccc3d8] whitespace-nowrap font-mono">
                {{ formatDate(tx.date) }}
              </td>

              <!-- Description & Notes (Full untruncated text) -->
              <td class="py-2.5 px-3 text-xs">
                <p class="font-bold text-[#dae2fd] break-words whitespace-normal leading-snug">{{ tx.description || 'No description' }}</p>
                <p v-if="tx.notes" class="text-[10px] text-[#ccc3d8] break-words whitespace-normal leading-snug mt-0.5">{{ tx.notes }}</p>
              </td>

              <!-- Bucket Badge -->
              <td class="py-2.5 px-3 text-xs">
                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#0b1326] text-[#d2bbff] border border-[#31394d] text-[10px] font-semibold">
                  <span>{{ getBucketIcon(tx.bucket_id) }}</span>
                  <span class="break-words">{{ getBucketName(tx.bucket_id) }}</span>
                </span>
              </td>

              <!-- Account -->
              <td class="py-2.5 px-3 text-xs text-[#ccc3d8]">
                <span class="font-medium break-words">{{ getAccountName(tx.account_id) }}</span>
              </td>

              <!-- Category -->
              <td class="py-2.5 px-3 text-xs">
                <span class="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-[#0b1326] text-[#dae2fd] text-[10px] font-semibold border border-[#31394d]">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: getCategoryColor(tx.category_id) }"></span>
                  <span class="break-words">{{ getCategoryName(tx.category_id) }}</span>
                </span>
              </td>

              <!-- Type -->
              <td class="py-2 px-3 text-xs whitespace-nowrap">
                <span 
                  class="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                  :class="transactionBadgeClass(tx)"
                >
                  {{ transactionLabel(tx) }}
                </span>
              </td>

              <!-- Amount -->
              <td 
                class="py-2 px-3 text-right text-xs font-bold whitespace-nowrap tabular-nums"
                :class="transactionAmountClass(tx)"
              >
                {{ transactionSign(tx) }}₹{{ formatAmount(tx.amount) }}
              </td>

              <!-- Actions -->
              <td class="py-2 px-3 pr-4 text-center whitespace-nowrap">
                <div class="flex justify-center items-center gap-2">
                  <button 
                    @click.stop="$emit('edit-transaction', tx)"
                    class="text-[11px] font-bold text-[#d2bbff] hover:text-white transition cursor-pointer"
                  >
                    Edit
                  </button>
                  <button 
                    @click.stop="confirmDelete(tx)"
                    class="text-[11px] font-bold text-[#ffb4ab] hover:text-rose-300 transition cursor-pointer shrink-0"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="displayedTransactions.length === 0">
              <td colspan="8" class="p-8 text-center text-xs font-semibold text-[#ccc3d8]">
                No transactions found matching the selected filters.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="flex items-center justify-between px-4 py-2.5 bg-[#0b1326]/60 border-t border-[#31394d]">
        <p class="text-xs text-[#ccc3d8]">
          Showing <span class="font-bold text-[#dae2fd]">{{ displayedTransactions.length }}</span> of <span class="font-bold text-[#dae2fd]">{{ summary.total_count }}</span> items
        </p>
        <div class="flex gap-2">
          <button 
            @click="prevPage" 
            :disabled="page === 1"
            class="h-7 px-3 text-xs font-bold text-[#dae2fd] bg-[#0b1326] hover:bg-[#131b2e] border border-[#31394d] rounded-lg disabled:opacity-35 transition cursor-pointer"
          >
            Previous
          </button>
          <button 
            @click="nextPage" 
            :disabled="page * limit >= summary.total_count"
            class="h-7 px-3 text-xs font-bold text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded-lg disabled:bg-[#31394d] disabled:text-[#ccc3d8] disabled:opacity-50 transition cursor-pointer shadow-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Transaction Details Modal Card (Top-Populating #0b1326 Card Design) -->
    <div 
      v-if="selectedTransactionForView"
      class="fixed inset-0 z-50 flex items-start justify-center p-4 pt-4 sm:pt-12 bg-black/75 backdrop-blur-md overflow-y-auto"
      @click.self="closeViewModal"
    >
      <div class="bg-[#0b1326] border border-[#31394d] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Modal Header -->
        <div class="flex justify-between items-center px-5 py-3.5 border-b border-[#31394d] bg-[#131b2e]/60">
          <div class="flex items-center gap-2.5">
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#0b1326] border border-[#31394d] text-base">
              {{ getBucketIcon(selectedTransactionForView.bucket_id) }}
            </span>
            <div>
              <h3 class="text-sm font-bold text-[#dae2fd]">
                {{ isEditingInModal ? 'Edit Transaction' : 'Transaction Details' }}
              </h3>
              <p class="text-[10px] text-[#ccc3d8]">
                {{ isEditingInModal ? 'Update transaction details below' : 'Complete record breakdown' }}
              </p>
            </div>
          </div>
          <button 
            @click="closeViewModal"
            class="w-8 h-8 rounded-full bg-[#131b2e] border border-[#31394d] text-[#ccc3d8] hover:text-white flex items-center justify-center text-sm transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- Modal Body (View Mode) -->
        <div v-if="!isEditingInModal" class="p-5 space-y-4">
          <!-- Hero Amount Card -->
          <div class="bg-[#131b2e] border border-[#31394d] rounded-xl p-4 text-center space-y-1">
            <span 
              class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1"
              :class="transactionBadgeClass(selectedTransactionForView)"
            >
              {{ transactionLabel(selectedTransactionForView) }}
            </span>
            <div 
              class="text-2xl font-bold tabular-nums tracking-tight"
              :class="transactionAmountClass(selectedTransactionForView)"
            >
              {{ transactionSign(selectedTransactionForView) }}₹{{ formatAmount(selectedTransactionForView.amount) }}
            </div>
            <p class="text-xs font-semibold text-[#dae2fd] break-words pt-1">
              {{ selectedTransactionForView.description || 'No Description' }}
            </p>
          </div>

          <!-- Information Grid -->
          <div class="grid grid-cols-2 gap-2.5 text-xs">
            <!-- Category -->
            <div class="bg-[#131b2e]/70 border border-[#31394d] rounded-xl p-3 space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#ccc3d8]">Category</span>
              <div class="flex items-center gap-1.5 pt-0.5">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: getCategoryColor(selectedTransactionForView.category_id) }"></span>
                <span class="font-bold text-[#dae2fd] break-words">{{ getCategoryName(selectedTransactionForView.category_id) }}</span>
              </div>
            </div>

            <!-- Date -->
            <div class="bg-[#131b2e]/70 border border-[#31394d] rounded-xl p-3 space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#ccc3d8]">Date</span>
              <p class="font-bold text-[#dae2fd] pt-0.5">{{ formatDate(selectedTransactionForView.date) }}</p>
            </div>

            <!-- Account -->
            <div class="bg-[#131b2e]/70 border border-[#31394d] rounded-xl p-3 space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#ccc3d8]">Storage Account</span>
              <p class="font-bold text-[#dae2fd] break-words pt-0.5">{{ getAccountName(selectedTransactionForView.account_id) }}</p>
            </div>

            <!-- Bucket / Vault -->
            <div class="bg-[#131b2e]/70 border border-[#31394d] rounded-xl p-3 space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#ccc3d8]">Bucket</span>
              <div class="flex items-center gap-1.5 pt-0.5">
                <span>{{ getBucketIcon(selectedTransactionForView.bucket_id) }}</span>
                <span class="font-bold text-[#dae2fd] break-words">{{ getBucketName(selectedTransactionForView.bucket_id) }}</span>
              </div>
            </div>
          </div>

          <!-- Notes / Additional Description (Always Shown) -->
          <div class="bg-[#131b2e]/70 border border-[#31394d] rounded-xl p-3 space-y-1 text-xs">
            <span class="text-[10px] font-bold uppercase tracking-wider text-[#ccc3d8]">Additional Notes / Description</span>
            <p v-if="selectedTransactionForView.notes" class="text-[#dae2fd] leading-relaxed break-words pt-0.5 font-medium">
              {{ selectedTransactionForView.notes }}
            </p>
            <p v-else class="text-[#ccc3d8]/50 italic text-xs font-medium pt-0.5">
              N/A
            </p>
          </div>
        </div>

        <!-- Modal Body (Inline Edit Mode) -->
        <div v-else class="p-4 space-y-3">
          <!-- Description / Title -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Description / Title</label>
            <input 
              v-model="editForm.description"
              type="text"
              placeholder="e.g. Dinner, Grocery Shopping..."
              class="w-full h-8 px-2.5 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-xs text-[#dae2fd] placeholder-[#ccc3d8]/40 focus:outline-none transition"
            />
          </div>

          <!-- Amount & Type Grid -->
          <div class="grid grid-cols-2 gap-2.5">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Amount (₹)</label>
              <input 
                v-model.number="editForm.amount"
                type="number"
                step="any"
                class="w-full h-8 px-2.5 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-xs font-bold text-[#dae2fd] focus:outline-none transition"
              />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Type</label>
              <select 
                v-model="editForm.transaction_type"
                class="w-full h-8 px-2 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-xs text-[#dae2fd] focus:outline-none transition cursor-pointer"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>
          </div>

          <!-- Category & Account Grid -->
          <div class="grid grid-cols-2 gap-2.5">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Category</label>
              <select 
                v-model="editForm.category_id"
                class="w-full h-8 px-2 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-xs text-[#dae2fd] focus:outline-none transition cursor-pointer"
              >
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.icon || '🏷️' }} {{ cat.name }}
                </option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Storage Account</label>
              <select 
                v-model="editForm.account_id"
                class="w-full h-8 px-2 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-xs text-[#dae2fd] focus:outline-none transition cursor-pointer"
              >
                <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                  {{ acc.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Bucket & Date Grid -->
          <div class="grid grid-cols-2 gap-2.5">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Savings Bucket</label>
              <select 
                v-model="editForm.bucket_id"
                class="w-full h-8 px-2 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-xs text-[#dae2fd] focus:outline-none transition cursor-pointer"
              >
                <option value="">No Bucket</option>
                <option v-for="b in buckets" :key="b.id" :value="b.id">
                  {{ b.icon || '🪣' }} {{ b.name }}
                </option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Date</label>
              <input 
                v-model="editForm.date"
                type="date"
                @click="$event.target.showPicker?.()"
                class="w-full h-8 px-2.5 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-xs text-[#dae2fd] focus:outline-none transition cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>

          <!-- Notes -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Additional Notes</label>
            <textarea 
              v-model="editForm.notes"
              rows="2"
              placeholder="Add optional transaction notes..."
              class="w-full p-2 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-xs text-[#dae2fd] placeholder-[#ccc3d8]/40 focus:outline-none transition"
            ></textarea>
          </div>
        </div>

        <!-- Modal Footer Actions (View Mode) -->
        <div v-if="!isEditingInModal" class="flex items-center gap-2.5 p-3.5 bg-[#131b2e]/60 border-t border-[#31394d]">
          <button 
            @click="startModalEdit" 
            class="flex-1 h-9 px-3 rounded-lg bg-[#7c3aed] text-white text-xs font-bold hover:bg-[#6d28d9] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <span>✏️</span> Edit Record
          </button>
          <button 
            @click="deleteFromModal" 
            class="h-9 px-3 rounded-lg bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] text-xs font-bold hover:bg-[#ffb4ab]/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>🗑️</span> Delete
          </button>
        </div>

        <!-- Modal Footer Actions (Inline Edit Mode) -->
        <div v-else class="flex items-center justify-between gap-2 p-3.5 bg-[#131b2e]/60 border-t border-[#31394d]">
          <button 
            @click="deleteFromModal" 
            class="h-8 px-2.5 rounded-lg bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] text-xs font-bold hover:bg-[#ffb4ab]/20 transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>🗑️</span> Delete
          </button>
          <div class="flex items-center gap-2">
            <button 
              @click="cancelModalEdit" 
              class="h-8 px-3 rounded-lg bg-[#0b1326] border border-[#31394d] text-[#ccc3d8] text-xs font-bold hover:bg-[#131b2e] transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              @click="saveModalEdit" 
              class="h-8 px-3.5 rounded-lg bg-[#7c3aed] text-white text-xs font-bold hover:bg-[#6d28d9] transition flex items-center justify-center gap-1 cursor-pointer shadow-md"
            >
              <span>✓</span> Save Changes
            </button>
          </div>
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
  },
  summary: {
    type: Object,
    default: () => ({ total_count: 0, total_expense: 0, categories_breakdown: [] })
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
const selectedIndex = ref(null);
const selectedChartCategoryName = ref(null);
const selectedTransactionForView = ref(null);
const isEditingInModal = ref(false);
const editForm = ref({
  description: '',
  notes: '',
  amount: 0,
  date: '',
  category_id: '',
  account_id: '',
  bucket_id: '',
  transaction_type: 'expense'
});

const viewTransactionDetails = (tx) => {
  selectedTransactionForView.value = tx;
  isEditingInModal.value = false;
};

const closeViewModal = () => {
  selectedTransactionForView.value = null;
  isEditingInModal.value = false;
};

const startModalEdit = () => {
  const tx = selectedTransactionForView.value;
  if (!tx) return;
  editForm.value = {
    description: tx.description || '',
    notes: tx.notes || '',
    amount: tx.amount,
    date: tx.date || '',
    category_id: tx.category_id,
    account_id: tx.account_id,
    bucket_id: tx.bucket_id || '',
    transaction_type: tx.transaction_type || 'expense'
  };
  isEditingInModal.value = true;
};

const cancelModalEdit = () => {
  isEditingInModal.value = false;
};

const saveModalEdit = () => {
  const tx = selectedTransactionForView.value;
  if (!tx) return;
  emit('edit-transaction-save', {
    id: tx.id,
    payload: { ...editForm.value }
  });
  closeViewModal();
};

const deleteFromModal = () => {
  const tx = selectedTransactionForView.value;
  if (!tx) return;
  confirmDelete(tx);
  closeViewModal();
};

const activeIndex = computed(() => {
  return selectedIndex.value !== null ? selectedIndex.value : hoveredIndex.value;
});

const displayedTransactions = computed(() => {
  return props.transactions;
});

const toggleSelectIndex = (item) => {
  const idx = typeof item === 'number' ? item : item.originalIndex;
  const itemObj = typeof item === 'number' ? piePaths.value.find(p => p.originalIndex === idx) : item;
  
  if (selectedIndex.value === idx) {
    selectedIndex.value = null;
    hoveredIndex.value = null;
    filters.value.category_ids = [];
  } else {
    selectedIndex.value = idx;
    hoveredIndex.value = idx;
    if (itemObj) {
      const targetCat = props.categories.find(c => c.name === itemObj.name || c.id === itemObj.id);
      if (targetCat) {
        filters.value.category_ids = [targetCat.id];
      }
    }
  }
  emitFilters();
};

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

// Full filtered breakdown is calculated from all matching database rows, not the page.
const categorySpending = computed(() => {
  const totalExp = Number(props.summary.total_expense) || 0;
  if (totalExp === 0) return [];
  const results = (props.summary.categories_breakdown || []).map((category, idx) => {
    const amount = Number(category.total) || 0;
    return {
      id: category.name,
      name: category.name || 'Uncategorized',
      color: category.color || '#6366f1',
      amount,
      percentage: Math.round((amount / totalExp) * 100),
      index: idx
    };
  });

  return results.sort((a, b) => b.amount - a.amount);
});

const totalFilteredExpenses = computed(() => {
  return Number(props.summary.total_expense) || 0;
});

// SVG Path-Arc calculation for modern donut chart with expanded hit targets
const piePaths = computed(() => {
  const total = totalFilteredExpenses.value;
  if (!total || categorySpending.value.length === 0) return [];

  const cx = 100;
  const cy = 100;

  // Thin visual ring radii
  const outerR = 86;
  const innerR = 74; // Sleek 12px visual ring width!

  // Expanded invisible hit-target radii for easy clicking
  const hitOuterR = 98;
  const hitInnerR = 62; // Wide 36px hit target!

  let currentAngle = -Math.PI / 2;

  return categorySpending.value.map((item, idx) => {
    const fraction = item.amount / total;
    const angleSpan = fraction * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleSpan;
    const percentage = Math.round(fraction * 100);
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
      percentage,
      d: createArcPath(outerR, innerR),
      hitD: createArcPath(hitOuterR, hitInnerR),
      originalIndex: idx
    };
  });
});

const activeLegendItems = computed(() => {
  const items = piePaths.value;
  const currentIdx = activeIndex.value;
  if (currentIdx === null) {
    return items;
  }
  const selectedItem = items.find(it => it.originalIndex === currentIdx);
  if (!selectedItem) return items;

  const rest = items.filter(it => it.originalIndex !== currentIdx);
  return [selectedItem, ...rest];
});

const activeCategoryInfo = computed(() => {
  const currentIdx = activeIndex.value;
  if (currentIdx !== null && categorySpending.value[currentIdx]) {
    return categorySpending.value[currentIdx];
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

const transactionSign = tx => {
  if (tx.transaction_type === 'income') return '+';
  if (tx.transaction_type === 'adjustment') return tx.adjustment_direction === 'subtract' ? '−' : '+';
  return '−';
};

const transactionLabel = tx => tx.transaction_type === 'adjustment'
  ? `Adjustment ${tx.adjustment_direction === 'subtract' ? '−' : '+'}`
  : (tx.transaction_type === 'income' ? 'Income' : 'Expense');

const transactionAmountClass = tx => transactionSign(tx) === '+' ? 'text-emerald-400' : 'text-rose-400';
const transactionBadgeClass = tx => tx.transaction_type === 'adjustment'
  ? 'bg-amber-950/80 text-amber-300 border border-amber-700/40'
  : (tx.transaction_type === 'income'
      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/30'
      : 'bg-rose-950/80 text-rose-400 border border-rose-800/30');

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

<style scoped>
.flip-list-move,
.flip-list-enter-active,
.flip-list-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
