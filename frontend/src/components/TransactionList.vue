<template>
  <div 
    class="space-y-3 overflow-hidden touch-pan-y"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @mousedown="onTouchStart"
    @mousemove="onTouchMove"
    @mouseup="onTouchEnd"
    @mouseleave="onTouchEnd"
  >
    <!-- Single Ultra-Compact Control & Navigation Strip -->
    <div class="bg-[#131b2e] border border-[#31394d] rounded-xl p-2 shadow-sm flex flex-wrap items-center justify-between gap-2">
      <!-- Left: Month Navigator & Range Toggle -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <!-- Month Navigator -->
        <div v-if="timeMode === 'monthly'" class="flex items-center gap-0.5 bg-[#0b1326] border border-[#31394d] rounded-lg p-0.5 shadow-inner">
          <button 
            @click="prevMonth"
            class="w-6 h-6 rounded bg-[#131b2e] hover:bg-[#1f2b48] text-[#dae2fd] flex items-center justify-center text-[10px] font-bold transition cursor-pointer active:scale-95"
            title="Previous Month"
          >
            ◀
          </button>
          <span class="px-2 text-xs font-bold text-[#dae2fd] min-w-[105px] text-center select-none tracking-tight">
            {{ formattedMonthYear }}
          </span>
          <button 
            @click="nextMonth"
            class="w-6 h-6 rounded bg-[#131b2e] hover:bg-[#1f2b48] text-[#dae2fd] flex items-center justify-center text-[10px] font-bold transition cursor-pointer active:scale-95"
            title="Next Month"
          >
            ▶
          </button>
        </div>

        <!-- Custom Range Toggle -->
        <button 
          @click="toggleTimeMode"
          class="h-7 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-sm border"
          :class="timeMode === 'range' 
            ? 'bg-[#7c3aed] text-white border-[#7c3aed]' 
            : 'bg-[#0b1326] text-[#d2bbff] border-[#31394d] hover:border-[#7c3aed]'"
          :title="timeMode === 'monthly' ? 'Switch to Custom Range' : 'Switch back to Monthly View'"
        >
          <span>{{ timeMode === 'range' ? '📅 Monthly View' : '📆 Custom Range' }}</span>
        </button>

        <!-- Choose Filters Button -->
        <button 
          @click="showFilterDrawer = !showFilterDrawer"
          class="h-7 px-2.5 bg-[#0b1326] hover:bg-[#1a243b] border border-[#31394d] hover:border-[#7c3aed] rounded-lg text-xs font-bold text-[#d2bbff] flex items-center gap-1 transition cursor-pointer"
        >
          <span>🔍 Filters</span>
          <span v-if="activeFilterCount > 0" class="px-1.5 py-0.2 rounded-full text-[9px] bg-[#7c3aed] text-white font-bold">
            {{ activeFilterCount }}
          </span>
          <span class="text-[9px] text-[#ccc3d8] transition" :class="{ 'rotate-180': showFilterDrawer }">▼</span>
        </button>

        <!-- Sort Control Dropdown -->
        <div class="flex items-center gap-0.5 bg-[#0b1326] border border-[#31394d] focus-within:border-[#7c3aed] rounded-lg px-2 h-7 transition">
          <span class="text-xs text-[#d2bbff] font-bold">⇅</span>
          <select 
            v-model="sortBy"
            class="bg-transparent text-[#dae2fd] text-xs font-bold focus:outline-none cursor-pointer pr-0.5"
          >
            <option value="date_desc" class="bg-[#0b1326] text-[#dae2fd]">Newest First</option>
            <option value="date_asc" class="bg-[#0b1326] text-[#dae2fd]">Oldest First</option>
            <option value="amount_desc" class="bg-[#0b1326] text-[#dae2fd]">Most Expensive</option>
            <option value="amount_asc" class="bg-[#0b1326] text-[#dae2fd]">Least Expensive</option>
          </select>
        </div>

        <button 
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="h-7 px-2 bg-[#ffb4ab]/10 hover:bg-[#ffb4ab]/20 border border-[#ffb4ab]/30 rounded-lg text-xs font-bold text-[#ffb4ab] transition cursor-pointer flex items-center gap-0.5"
          title="Clear all active filters"
        >
          <span>Clear</span>
          <span class="text-xs">✕</span>
        </button>
      </div>

      <!-- Right: Chart View Mode Segmented Toggle -->
      <div class="inline-flex p-0.5 bg-[#0b1326] border border-[#31394d] rounded-lg text-[10px] font-bold">
        <button 
          @click="chartViewMode = 'both'"
          class="px-2 py-0.5 rounded transition cursor-pointer"
          :class="chartViewMode === 'both' ? 'bg-[#7c3aed] text-white' : 'text-[#ccc3d8] hover:text-white'"
        >
          Both
        </button>
        <button 
          @click="chartViewMode = 'expense'"
          class="px-2 py-0.5 rounded transition cursor-pointer"
          :class="chartViewMode === 'expense' ? 'bg-[#ffb4ab]/30 text-[#ffb4ab] border border-[#ffb4ab]/40' : 'text-[#ccc3d8] hover:text-white'"
        >
          Expenses
        </button>
        <button 
          @click="chartViewMode = 'income'"
          class="px-2 py-0.5 rounded transition cursor-pointer"
          :class="chartViewMode === 'income' ? 'bg-[#4edea3]/30 text-[#4edea3] border border-[#4edea3]/40' : 'text-[#ccc3d8] hover:text-white'"
        >
          Income
        </button>
      </div>
    </div>

    <!-- Range Selector Drawer (Visible when timeMode === 'range') -->
    <Transition name="fade-slide">
      <div v-if="timeMode === 'range'" class="bg-[#131b2e] border border-[#31394d] rounded-xl p-3 shadow-sm space-y-3">
        <div class="flex flex-col sm:flex-row items-center gap-3">
          <div class="flex-1 space-y-1 w-full">
            <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Select Time Range</label>
            <select 
              v-model="rangeTimeChoice"
              class="h-8 px-2.5 bg-[#0b1326] border border-[#31394d] rounded-lg text-[#dae2fd] text-xs font-semibold focus:outline-none focus:border-[#7c3aed] transition cursor-pointer w-full"
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_6_months">Last 6 Months</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>
        </div>

        <!-- Custom Date Inputs (Visible when rangeTimeChoice === 'custom') -->
        <div v-if="rangeTimeChoice === 'custom'" class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#31394d]">
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Start Date</label>
            <input 
              v-model="startDateInput"
              type="date"
              @click="$event.target.showPicker?.()"
              class="w-full h-8 px-2.5 bg-[#0b1326] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-[#dae2fd] text-xs focus:outline-none transition cursor-pointer [color-scheme:dark]"
            />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">End Date</label>
            <input 
              v-model="endDateInput"
              type="date"
              @click="$event.target.showPicker?.()"
              class="w-full h-8 px-2.5 bg-[#0b1326] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-[#dae2fd] text-xs focus:outline-none transition cursor-pointer [color-scheme:dark]"
            />
          </div>
        </div>
      </div>
    </Transition>

        <!-- Collapsible Multi-Select Filter Drawer Panel (Opened directly under control bar) -->
        <Transition name="fade-slide">
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
                  class="w-full h-8 px-2.5 bg-[#0b1326] border border-[#31394d] hover:bg-[#131b2e] focus:border-[#7c3aed] rounded-lg text-[#dae2fd] text-xs focus:outline-none transition cursor-pointer"
                >
                  <option value="" class="bg-[#0b1326] text-[#ccc3d8]">All Accounts</option>
                  <option v-for="acc in accounts" :key="acc.id" :value="acc.id" class="bg-[#0b1326] text-[#dae2fd]">{{ acc.name }}</option>
                </select>
              </div>

              <!-- Category Filter (Multi-select) -->
              <div class="space-y-1">
                <div class="flex justify-between items-center">
                  <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Categories</label>
                  <div class="flex items-center gap-1.5 text-[10px] font-bold">
                    <button 
                      type="button"
                      @click="selectAllCategories" 
                      class="text-[#7c3aed] hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span class="text-[#31394d]">|</span>
                    <button 
                      type="button"
                      @click="deselectAllCategories" 
                      class="text-[#ccc3d8] hover:text-[#ffb4ab] hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div class="p-2 bg-[#0b1326] border border-[#31394d] rounded-lg max-h-36 overflow-y-auto space-y-1">
                  <label 
                    v-for="cat in categories" 
                    :key="cat.id"
                    class="flex items-center gap-2 px-1.5 py-0.5 rounded hover:bg-[#131b2e] cursor-pointer text-xs text-[#dae2fd]"
                  >
                    <input 
                      type="checkbox"
                      :value="cat.id"
                      v-model="filters.category_ids"
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
                  class="w-full h-8 px-2.5 bg-[#0b1326] border border-[#31394d] hover:bg-[#131b2e] focus:border-[#7c3aed] rounded-lg text-[#dae2fd] text-xs focus:outline-none transition cursor-pointer"
                >
                  <option value="" class="bg-[#0b1326] text-[#ccc3d8]">All Types</option>
                  <option value="income" class="bg-[#0b1326] text-[#dae2fd]">Income</option>
                  <option value="expense" class="bg-[#0b1326] text-[#dae2fd]">Expense</option>
                  <option value="adjustment" class="bg-[#0b1326] text-[#dae2fd]">Adjustment</option>
                </select>
              </div>
            </div>
          </div>
        </Transition>

    <!-- Dual Expenses & Income Donut Charts Container with Full Slide Transition -->
    <Transition :name="slideDirection === 'next' ? 'slide-next' : 'slide-prev'" mode="out-in">
      <div 
        :key="timeMode === 'monthly' ? formattedMonthYear : rangeTimeChoice"
        class="space-y-4 touch-pan-y"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @mousedown="onTouchStart"
        @mousemove="onTouchMove"
        @mouseup="onTouchEnd"
        @mouseleave="onTouchEnd"
      >
        <!-- Expenses Breakdown Donut Chart -->
        <section 
          v-if="chartViewMode === 'both' || chartViewMode === 'expense'"
          class="bg-[#131b2e] border border-[#31394d] rounded-xl p-4 space-y-4 shadow-sm"
        >
          <div class="border-b border-[#31394d] pb-2">
            <h2 class="text-sm font-bold text-[#dae2fd] tracking-tight">Expenses Breakdown</h2>
          </div>

          <div v-if="expensePiePaths.length === 0" class="p-8 text-center text-xs font-semibold text-[#ccc3d8]">
            No expense records found for this period.
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-2">
            <!-- SVG Donut Ring -->
            <div class="md:col-span-6 flex items-center justify-center">
              <div class="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center shrink-0">
                <svg class="w-full h-full overflow-visible" viewBox="-24 -24 248 248">
                  <g
                    v-for="segment in expensePiePaths"
                    :key="segment.name"
                    class="cursor-pointer"
                    @mouseenter="hoveredExpenseIndex = segment.originalIndex"
                    @mouseleave="hoveredExpenseIndex = null"
                    @click="toggleSelectExpenseCategory(segment.originalIndex)"
                  >
                    <path :d="segment.hitD" fill="transparent" />
                    <path
                      :d="segment.d"
                      :fill="segment.color"
                      class="transition-all duration-300 pointer-events-none"
                      :style="{
                        transformOrigin: '100px 100px',
                        filter: activeExpenseIndex === segment.originalIndex ? `drop-shadow(0 0 12px ${segment.color})` : 'none',
                        transform: activeExpenseIndex === segment.originalIndex ? 'scale(1.05)' : 'scale(1)',
                        opacity: activeExpenseIndex === null || activeExpenseIndex === segment.originalIndex ? 1 : 0.45
                      }"
                    />
                  </g>
                </svg>

                <!-- Center Readout -->
                <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-3">
                  <span class="text-xs font-semibold text-[#ccc3d8] truncate max-w-[130px]">
                    {{ activeHoveredExpenseInfo ? activeHoveredExpenseInfo.name : 'Expenses' }}
                  </span>
                  <div class="text-xl sm:text-2xl font-bold text-[#dae2fd] tabular-nums tracking-tight mt-0.5">
                    <span class="text-sm text-[#ccc3d8] font-bold">₹</span>{{ formatAmount(activeHoveredExpenseInfo ? activeHoveredExpenseInfo.amount : totalFilteredCategoryExpense) }}
                  </div>
                  <span v-if="activeHoveredExpenseInfo" class="text-xs font-bold text-[#ffb4ab] mt-0.5 px-2 py-0.5 rounded-full bg-[#ffb4ab]/10 border border-[#ffb4ab]/20">
                    {{ activeHoveredExpenseInfo.percentage }}% of total
                  </span>
                </div>
              </div>
            </div>

            <!-- Interactive Borderless Legend List -->
            <TransitionGroup 
              name="flip-list" 
              tag="div" 
              class="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 max-h-56 overflow-y-auto p-1"
            >
              <div 
                v-for="item in activeExpenseLegendItems"
                :key="item.name"
                @mouseenter="hoveredExpenseIndex = item.originalIndex"
                @mouseleave="hoveredExpenseIndex = null"
                @click="toggleSelectExpenseCategory(item.originalIndex)"
                class="flex items-center justify-between py-1.5 px-2 rounded-lg transition-all duration-200 cursor-pointer hover:bg-[#171f33]"
                :class="activeExpenseIndex === item.originalIndex ? 'bg-[#171f33] ring-1 ring-[#7c3aed]/50' : ''"
              >
                <!-- Left: Color dot + Category Name -->
                <div class="flex items-center gap-2 min-w-0">
                  <span 
                    class="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-200"
                    :style="{ 
                      backgroundColor: item.color,
                      boxShadow: activeExpenseIndex === item.originalIndex ? `0 0 8px ${item.color}` : 'none' 
                    }"
                  ></span>
                  <span class="text-xs font-bold text-[#dae2fd] truncate leading-none">{{ item.name }}</span>
                </div>

                <!-- Right: Percentage + Amount -->
                <div class="flex items-center gap-2 shrink-0 tabular-nums">
                  <span class="text-[10px] font-semibold text-[#ccc3d8] bg-[#0b1326] px-1.5 py-0.2 rounded border border-[#31394d]">{{ item.percentage }}%</span>
                  <span class="text-xs font-bold" :style="{ color: activeExpenseIndex === item.originalIndex ? item.color : '#dae2fd' }">
                    ₹{{ formatAmount(item.amount) }}
                  </span>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </section>

        <!-- Income Breakdown Donut Chart -->
        <section 
          v-if="chartViewMode === 'both' || chartViewMode === 'income'"
          class="bg-[#131b2e] border border-[#31394d] rounded-xl p-4 space-y-4 shadow-sm"
        >
          <div class="border-b border-[#31394d] pb-2">
            <h2 class="text-sm font-bold text-[#dae2fd] tracking-tight">Income Breakdown</h2>
          </div>

          <div v-if="incomePiePaths.length === 0" class="p-8 text-center text-xs font-semibold text-[#ccc3d8]">
            No income records found for this period.
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-2">
            <!-- SVG Donut Ring -->
            <div class="md:col-span-6 flex items-center justify-center">
              <div class="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center shrink-0">
                <svg class="w-full h-full overflow-visible" viewBox="-24 -24 248 248">
                  <g
                    v-for="segment in incomePiePaths"
                    :key="segment.name"
                    class="cursor-pointer"
                    @mouseenter="hoveredIncomeIndex = segment.originalIndex"
                    @mouseleave="hoveredIncomeIndex = null"
                    @click="toggleSelectIncomeCategory(segment.originalIndex)"
                  >
                    <path :d="segment.hitD" fill="transparent" />
                    <path
                      :d="segment.d"
                      :fill="segment.color"
                      class="transition-all duration-300 pointer-events-none"
                      :style="{
                        transformOrigin: '100px 100px',
                        filter: activeIncomeIndex === segment.originalIndex ? `drop-shadow(0 0 12px ${segment.color})` : 'none',
                        transform: activeIncomeIndex === segment.originalIndex ? 'scale(1.05)' : 'scale(1)',
                        opacity: activeIncomeIndex === null || activeIncomeIndex === segment.originalIndex ? 1 : 0.45
                      }"
                    />
                  </g>
                </svg>

                <!-- Center Readout -->
                <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-3">
                  <span class="text-xs font-semibold text-[#ccc3d8] truncate max-w-[130px]">
                    {{ activeHoveredIncomeInfo ? activeHoveredIncomeInfo.name : 'Income' }}
                  </span>
                  <div class="text-xl sm:text-2xl font-bold text-[#dae2fd] tabular-nums tracking-tight mt-0.5">
                    <span class="text-sm text-[#ccc3d8] font-bold">₹</span>{{ formatAmount(activeHoveredIncomeInfo ? activeHoveredIncomeInfo.amount : totalFilteredCategoryIncome) }}
                  </div>
                  <span v-if="activeHoveredIncomeInfo" class="text-xs font-bold text-[#4edea3] mt-0.5 px-2 py-0.5 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/20">
                    {{ activeHoveredIncomeInfo.percentage }}% of total
                  </span>
                </div>
              </div>
            </div>

            <!-- Interactive Borderless Legend List -->
            <TransitionGroup 
              name="flip-list" 
              tag="div" 
              class="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 max-h-56 overflow-y-auto p-1"
            >
              <div 
                v-for="item in activeIncomeLegendItems"
                :key="item.name"
                @mouseenter="hoveredIncomeIndex = item.originalIndex"
                @mouseleave="hoveredIncomeIndex = null"
                @click="toggleSelectIncomeCategory(item.originalIndex)"
                class="flex items-center justify-between py-1.5 px-2 rounded-lg transition-all duration-200 cursor-pointer hover:bg-[#171f33]"
                :class="activeIncomeIndex === item.originalIndex ? 'bg-[#171f33] ring-1 ring-[#7c3aed]/50' : ''"
              >
                <!-- Left: Color dot + Category Name -->
                <div class="flex items-center gap-2 min-w-0">
                  <span 
                    class="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-200"
                    :style="{ 
                      backgroundColor: item.color,
                      boxShadow: activeIncomeIndex === item.originalIndex ? `0 0 8px ${item.color}` : 'none' 
                    }"
                  ></span>
                  <span class="text-xs font-bold text-[#dae2fd] truncate leading-none">{{ item.name }}</span>
                </div>

                <!-- Right: Percentage + Amount -->
                <div class="flex items-center gap-2 shrink-0 tabular-nums">
                  <span class="text-[10px] font-semibold text-[#ccc3d8] bg-[#0b1326] px-1.5 py-0.2 rounded border border-[#31394d]">{{ item.percentage }}%</span>
                  <span class="text-xs font-bold" :style="{ color: activeIncomeIndex === item.originalIndex ? item.color : '#dae2fd' }">
                    ₹{{ formatAmount(item.amount) }}
                  </span>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </section>
      </div>
    </Transition>



    <!-- 4. Minimal & High-Density Grouped Transaction Records List -->
    <div id="history-records-section" v-if="displayedTransactions.length > 0" class="space-y-3">
      <div 
        v-for="group in groupedTransactionsByDate" 
        :key="group.dateStr" 
        class="space-y-1.5"
      >
        <!-- Group Date Header (Larger font, no calendar emoji, minimal borderless header) -->
        <div class="flex items-center justify-between px-1 py-1.5 border-b border-[#31394d]/50 text-xs sm:text-sm font-bold sticky top-14 z-10 bg-[#0b1326]/95 backdrop-blur-md">
          <span class="text-[#dae2fd] font-bold tracking-tight">{{ formatDateHeader(group.dateStr) }}</span>
          <div class="flex items-center gap-2 tabular-nums text-xs font-bold">
            <span v-if="group.totalExpense > 0" class="text-[#ffb4ab]">Spent: ₹{{ formatAmount(group.totalExpense) }}</span>
            <span v-if="group.totalIncome > 0" class="text-[#4edea3]">Income: ₹{{ formatAmount(group.totalIncome) }}</span>
          </div>
        </div>

        <!-- Group Records Unified Container with Hairline Dividers -->
        <div class="bg-[#131b2e] border border-[#31394d] rounded-xl overflow-hidden divide-y divide-[#31394d]/30 shadow-sm">
          <div 
            v-for="tx in group.transactions" 
            :key="tx.id" 
            @click="viewTransactionDetails(tx)"
            class="px-3 py-2.5 hover:bg-[#171f33] transition cursor-pointer flex items-center justify-between gap-2.5 min-h-[44px] active:bg-[#171f33]"
          >
            <!-- Left: Bucket Icon & Description Details -->
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#0b1326] border border-[#31394d] text-sm shrink-0">
                {{ getBucketIcon(tx.bucket_id) }}
              </span>

              <!-- Center: Description & Metadata -->
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-[#dae2fd] truncate leading-tight">{{ tx.description || 'No description' }}</p>
                <div class="flex items-center gap-1.5 text-[10px] text-[#ccc3d8] truncate mt-0.5">
                  <span class="inline-flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: getCategoryColor(tx.category_id) }"></span>
                    <span class="truncate font-medium">{{ getCategoryName(tx.category_id) }}</span>
                  </span>
                  <span>•</span>
                  <span class="truncate text-[#94a3b8] font-medium">{{ getAccountName(tx.account_id) }}</span>
                </div>
              </div>
            </div>

            <!-- Right: Amount (Clean & bold, without redundant badge pills) -->
            <div class="flex items-center gap-2 shrink-0 text-right">
              <span class="text-xs sm:text-sm font-bold block tabular-nums" :class="transactionAmountClass(tx)">
                {{ transactionSign(tx) }}₹{{ formatAmount(tx.amount) }}
              </span>

              <!-- Quick Edit/Delete Actions for Desktop -->
              <div class="hidden sm:flex gap-1 items-center ml-1">
                <button @click.stop="$emit('edit-transaction', tx)" class="p-1 text-[#d2bbff] hover:text-white text-xs cursor-pointer" title="Edit">✏️</button>
                <button @click.stop="confirmDelete(tx)" class="p-1 text-[#ffb4ab] hover:text-rose-300 text-xs cursor-pointer" title="Delete">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. Desktop Data Table Section (Visible on >= sm) -->
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
              <td class="py-2.5 px-3 pl-4 text-xs text-[#ccc3d8] whitespace-nowrap font-mono">
                {{ formatDate(tx.date) }}
              </td>

              <td class="py-2.5 px-3 text-xs">
                <p class="font-bold text-[#dae2fd] break-words whitespace-normal leading-snug">{{ tx.description || 'No description' }}</p>
                <p v-if="tx.notes" class="text-[10px] text-[#ccc3d8] break-words whitespace-normal leading-snug mt-0.5">{{ tx.notes }}</p>
              </td>

              <td class="py-2.5 px-3 text-xs">
                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#0b1326] text-[#d2bbff] border border-[#31394d] text-[10px] font-semibold">
                  <span>{{ getBucketIcon(tx.bucket_id) }}</span>
                  <span class="break-words">{{ getBucketName(tx.bucket_id) }}</span>
                </span>
              </td>

              <td class="py-2.5 px-3 text-xs text-[#ccc3d8]">
                <span class="font-medium break-words">{{ getAccountName(tx.account_id) }}</span>
              </td>

              <td class="py-2.5 px-3 text-xs">
                <span class="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-[#0b1326] text-[#dae2fd] text-[10px] font-semibold border border-[#31394d]">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: getCategoryColor(tx.category_id) }"></span>
                  <span class="break-words">{{ getCategoryName(tx.category_id) }}</span>
                </span>
              </td>

              <td class="py-2.5 px-3 text-xs whitespace-nowrap">
                <span 
                  class="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                  :class="transactionBadgeClass(tx)"
                >
                  {{ transactionLabel(tx) }}
                </span>
              </td>

              <td 
                class="py-2.5 px-3 text-right text-xs font-bold whitespace-nowrap tabular-nums"
                :class="transactionAmountClass(tx)"
              >
                {{ transactionSign(tx) }}₹{{ formatAmount(tx.amount) }}
              </td>

              <td class="py-2.5 px-3 pr-4 text-center whitespace-nowrap">
                <div class="flex justify-center items-center gap-2">
                  <button 
                    @click.stop="$emit('edit-transaction', tx)"
                    class="text-[11px] font-bold text-[#d2bbff] hover:text-white transition cursor-pointer"
                  >
                    Edit
                  </button>
                  <button 
                    @click.stop="confirmDelete(tx)"
                    class="text-[11px] font-bold text-[#ffb4ab] hover:text-rose-300 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="displayedTransactions.length === 0">
              <td colspan="8" class="text-center py-8 text-xs text-[#ccc3d8]">
                No transaction records found matching your filters.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 6. Transaction Details Modal Card -->
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

          <div class="grid grid-cols-2 gap-2.5 text-xs">
            <div class="bg-[#131b2e]/70 border border-[#31394d] rounded-xl p-3 space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#ccc3d8]">Category</span>
              <div class="flex items-center gap-1.5 pt-0.5">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: getCategoryColor(selectedTransactionForView.category_id) }"></span>
                <span class="font-bold text-[#dae2fd] break-words">{{ getCategoryName(selectedTransactionForView.category_id) }}</span>
              </div>
            </div>

            <div class="bg-[#131b2e]/70 border border-[#31394d] rounded-xl p-3 space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#ccc3d8]">Date</span>
              <p class="font-bold text-[#dae2fd] pt-0.5">{{ formatDate(selectedTransactionForView.date) }}</p>
            </div>

            <div class="bg-[#131b2e]/70 border border-[#31394d] rounded-xl p-3 space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#ccc3d8]">Storage Account</span>
              <p class="font-bold text-[#dae2fd] break-words pt-0.5">{{ getAccountName(selectedTransactionForView.account_id) }}</p>
            </div>

            <div class="bg-[#131b2e]/70 border border-[#31394d] rounded-xl p-3 space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#ccc3d8]">Bucket</span>
              <div class="flex items-center gap-1.5 pt-0.5">
                <span>{{ getBucketIcon(selectedTransactionForView.bucket_id) }}</span>
                <span class="font-bold text-[#dae2fd] break-words">{{ getBucketName(selectedTransactionForView.bucket_id) }}</span>
              </div>
            </div>
          </div>

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
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Description / Title</label>
            <input 
              v-model="editForm.description"
              type="text"
              placeholder="e.g. Dinner, Grocery Shopping..."
              class="w-full h-8 px-2.5 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-xs text-[#dae2fd] placeholder-[#ccc3d8]/40 focus:outline-none transition"
            />
          </div>

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
  },
  summary: {
    type: Object,
    default: () => ({ total_count: 0 })
  }
});

const emit = defineEmits([
  'edit-transaction',
  'edit-transaction-save',
  'delete-transaction'
]);

// Time Mode & Navigation
const timeMode = ref('monthly'); // 'monthly' or 'range'
const currentMonthDate = ref(new Date());
const rangeTimeChoice = ref('this_month');
const startDateInput = ref('');
const endDateInput = ref('');

const toggleTimeMode = () => {
  timeMode.value = timeMode.value === 'monthly' ? 'range' : 'monthly';
};

// Filter Drawer State & Values
const showFilterDrawer = ref(false);
const sortBy = ref('date_desc'); // 'date_desc', 'date_asc', 'amount_desc', 'amount_asc'
const filters = ref({
  search: '',
  bucket_id: '',
  account_id: '',
  category_ids: [],
  transaction_type: ''
});

// Chart View Mode State (Default to 'expense')
const chartViewMode = ref('expense'); // 'expense', 'both', 'income'

// Full Slide Transition State
const slideDirection = ref('next'); // 'next' or 'prev'

// Touch Drag Tracking
const touchStartX = ref(0);
const touchStartY = ref(0);
const dragOffset = ref(0);
const isDragging = ref(false);

const onTouchStart = (e) => {
  const target = e.target;
  if (target && (target.closest('button') || target.closest('select') || target.closest('input') || target.closest('a'))) {
    return;
  }
  const touch = e.touches ? e.touches[0] : e;
  touchStartX.value = touch.clientX;
  touchStartY.value = touch.clientY;
  dragOffset.value = 0;
  isDragging.value = true;
};

const onTouchMove = (e) => {
  if (!isDragging.value) return;
  const touch = e.touches ? e.touches[0] : e;
  const deltaX = touch.clientX - touchStartX.value;
  const deltaY = touch.clientY - touchStartY.value;

  if (Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
    dragOffset.value = deltaX;
  }
};

const onTouchEnd = (e) => {
  if (!isDragging.value) return;
  const touch = e.changedTouches ? e.changedTouches[0] : (e.touches ? e.touches[0] : e);
  const deltaX = touch ? touch.clientX - touchStartX.value : dragOffset.value;
  const deltaY = touch ? touch.clientY - touchStartY.value : 0;

  isDragging.value = false;

  if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
    if (deltaX < 0) {
      nextMonth();
    } else {
      prevMonth();
    }
  }

  dragOffset.value = 0;
};

// Monthly Navigation Helpers
const formattedMonthYear = computed(() => {
  return currentMonthDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
});

const prevMonth = () => {
  slideDirection.value = 'prev';
  const d = new Date(currentMonthDate.value);
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  currentMonthDate.value = d;
};

const nextMonth = () => {
  slideDirection.value = 'next';
  const d = new Date(currentMonthDate.value);
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  currentMonthDate.value = d;
};

const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.value.search) count++;
  if (filters.value.bucket_id) count++;
  if (filters.value.account_id) count++;
  if (filters.value.category_ids.length > 0) count += filters.value.category_ids.length;
  if (filters.value.transaction_type) count++;
  if (rangeTimeChoice.value === 'custom' && (startDateInput.value || endDateInput.value)) count++;
  return count;
});

const hasActiveFilters = computed(() => activeFilterCount.value > 0);

const clearFilters = () => {
  filters.value = {
    search: '',
    bucket_id: '',
    account_id: '',
    category_ids: [],
    transaction_type: ''
  };
  startDateInput.value = '';
  endDateInput.value = '';
  selectedExpenseIndex.value = null;
  selectedIncomeIndex.value = null;
  selectedChartCategoryRecordId.value = null;
};

const selectAllCategories = () => {
  filters.value.category_ids = props.categories.map(c => c.id);
};

const deselectAllCategories = () => {
  filters.value.category_ids = [];
};

const parseYearMonth = (dateStr) => {
  if (!dateStr) return { year: -1, month: -1 };
  const cleanStr = String(dateStr).split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length >= 3) {
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10) - 1,
      day: parseInt(parts[2], 10)
    };
  }
  const d = new Date(dateStr);
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
};

// Transaction Filtering Logic
const isMatchingTransaction = (t) => {
  if (!t || !t.date) return false;

  // 1. Time Horizon Filter
  let dateMatch = true;
  const tInfo = parseYearMonth(t.date);

  if (timeMode.value === 'monthly') {
    const targetY = currentMonthDate.value.getFullYear();
    const targetM = currentMonthDate.value.getMonth();
    dateMatch = tInfo.year === targetY && tInfo.month === targetM;
  } else {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    switch (rangeTimeChoice.value) {
      case 'this_month':
        dateMatch = tInfo.year === year && tInfo.month === month;
        break;
      case 'last_month': {
        const targetMonth = month === 0 ? 11 : month - 1;
        const targetYear = month === 0 ? year - 1 : year;
        dateMatch = tInfo.year === targetYear && tInfo.month === targetMonth;
        break;
      }
      case 'last_3_months': {
        const threeMonthsAgo = new Date(year, month - 3, 1);
        const tDate = new Date(t.date);
        dateMatch = tDate >= threeMonthsAgo;
        break;
      }
      case 'last_6_months': {
        const sixMonthsAgo = new Date(year, month - 6, 1);
        const tDate = new Date(t.date);
        dateMatch = tDate >= sixMonthsAgo;
        break;
      }
      case 'this_year':
        dateMatch = tInfo.year === year;
        break;
      case 'custom': {
        const cleanDateStr = String(t.date).split('T')[0];
        if (startDateInput.value && cleanDateStr < startDateInput.value) dateMatch = false;
        if (endDateInput.value && cleanDateStr > endDateInput.value) dateMatch = false;
        break;
      }
      default:
        dateMatch = true;
    }
  }

  if (!dateMatch) return false;

  // 2. Search Filter
  if (filters.value.search) {
    const q = filters.value.search.toLowerCase();
    const desc = (t.description || '').toLowerCase();
    const notes = (t.notes || '').toLowerCase();
    if (!desc.includes(q) && !notes.includes(q)) return false;
  }

  // 3. Bucket Filter
  if (filters.value.bucket_id && t.bucket_id !== filters.value.bucket_id) {
    return false;
  }

  // 4. Account Filter
  if (filters.value.account_id && t.account_id !== filters.value.account_id) {
    return false;
  }

  // 5. Category Filter (Multi-select)
  if (filters.value.category_ids.length > 0 && !filters.value.category_ids.includes(t.category_id)) {
    return false;
  }

  // 6. Type Filter
  if (filters.value.transaction_type && t.transaction_type !== filters.value.transaction_type) {
    return false;
  }

  return true;
};

const selectedChartCategoryRecordId = ref(null);

const allPeriodTransactions = computed(() => {
  return props.transactions.filter(isMatchingTransaction);
});

const displayedTransactions = computed(() => {
  let list = allPeriodTransactions.value;
  if (selectedChartCategoryRecordId.value) {
    list = list.filter(t => t.category_id === selectedChartCategoryRecordId.value);
  }

  return [...list].sort((a, b) => {
    if (sortBy.value === 'date_asc') {
      return new Date(a.date) - new Date(b.date);
    }
    if (sortBy.value === 'amount_desc') {
      return Number(b.amount) - Number(a.amount);
    }
    if (sortBy.value === 'amount_asc') {
      return Number(a.amount) - Number(b.amount);
    }
    // Default: 'date_desc' (Newest first)
    return new Date(b.date) - new Date(a.date);
  });
});

const groupedTransactionsByDate = computed(() => {
  const groups = {};
  displayedTransactions.value.forEach(t => {
    const rawDate = t.date ? String(t.date).split('T')[0] : 'Unknown Date';
    if (!groups[rawDate]) {
      groups[rawDate] = { dateStr: rawDate, transactions: [], totalExpense: 0, totalIncome: 0 };
    }
    groups[rawDate].transactions.push(t);
    const amt = Number(t.amount) || 0;
    if (t.transaction_type === 'expense') groups[rawDate].totalExpense += amt;
    if (t.transaction_type === 'income') groups[rawDate].totalIncome += amt;
  });

  return Object.values(groups);
});

const formatDateHeader = (dateStr) => {
  if (!dateStr || dateStr === 'Unknown Date') return 'Unknown Date';
  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
  
  const yestObj = new Date();
  yestObj.setDate(yestObj.getDate() - 1);
  const yestStr = `${yestObj.getFullYear()}-${String(yestObj.getMonth() + 1).padStart(2, '0')}-${String(yestObj.getDate()).padStart(2, '0')}`;

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yestStr) return 'Yesterday';

  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

// Category Expense & Income Aggregation for Donut Charts (ALWAYS stays 100% full & intact!)
const filteredCategoryExpenses = computed(() => {
  const map = {};
  allPeriodTransactions.value.forEach(t => {
    if (t.transaction_type === 'expense') {
      const catName = getCategoryName(t.category_id);
      const catColor = getCategoryColor(t.category_id);
      const amt = Number(t.amount) || 0;
      if (!map[catName]) {
        map[catName] = { id: t.category_id, name: catName, color: catColor, total: 0 };
      }
      map[catName].total += amt;
    }
  });
  return Object.values(map).sort((a, b) => b.total - a.total);
});

const totalFilteredCategoryExpense = computed(() => {
  return filteredCategoryExpenses.value.reduce((sum, c) => sum + c.total, 0);
});

const filteredCategoryIncome = computed(() => {
  const map = {};
  allPeriodTransactions.value.forEach(t => {
    if (t.transaction_type === 'income') {
      const catName = getCategoryName(t.category_id);
      const catColor = getCategoryColor(t.category_id);
      const amt = Number(t.amount) || 0;
      if (!map[catName]) {
        map[catName] = { id: t.category_id, name: catName, color: catColor, total: 0 };
      }
      map[catName].total += amt;
    }
  });
  return Object.values(map).sort((a, b) => b.total - a.total);
});

const totalFilteredCategoryIncome = computed(() => {
  return filteredCategoryIncome.value.reduce((sum, c) => sum + c.total, 0);
});

// Expense Donut Reactive Logic
const hoveredExpenseIndex = ref(null);
const selectedExpenseIndex = ref(null);

const activeExpenseIndex = computed(() => {
  return selectedExpenseIndex.value !== null ? selectedExpenseIndex.value : hoveredExpenseIndex.value;
});

const scrollToHistoryRecords = () => {
  setTimeout(() => {
    const el = document.getElementById('history-records-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 50);
};

const toggleSelectExpenseCategory = (idx) => {
  if (selectedExpenseIndex.value === idx) {
    selectedExpenseIndex.value = null;
    hoveredExpenseIndex.value = null;
    selectedChartCategoryRecordId.value = null;
  } else {
    selectedExpenseIndex.value = idx;
    hoveredExpenseIndex.value = idx;
    const item = expensePiePaths.value[idx];
    if (item) {
      selectedChartCategoryRecordId.value = item.id;
    }
    scrollToHistoryRecords();
  }
};

const activeHoveredExpenseInfo = computed(() => {
  const currentIdx = activeExpenseIndex.value;
  if (currentIdx !== null && expensePiePaths.value[currentIdx]) {
    return expensePiePaths.value[currentIdx];
  }
  return null;
});

// Income Donut Reactive Logic
const hoveredIncomeIndex = ref(null);
const selectedIncomeIndex = ref(null);

const activeIncomeIndex = computed(() => {
  return selectedIncomeIndex.value !== null ? selectedIncomeIndex.value : hoveredIncomeIndex.value;
});

const toggleSelectIncomeCategory = (idx) => {
  if (selectedIncomeIndex.value === idx) {
    selectedIncomeIndex.value = null;
    hoveredIncomeIndex.value = null;
    selectedChartCategoryRecordId.value = null;
  } else {
    selectedIncomeIndex.value = idx;
    hoveredIncomeIndex.value = idx;
    const item = incomePiePaths.value[idx];
    if (item) {
      selectedChartCategoryRecordId.value = item.id;
    }
    scrollToHistoryRecords();
  }
};

const activeHoveredIncomeInfo = computed(() => {
  const currentIdx = activeIncomeIndex.value;
  if (currentIdx !== null && incomePiePaths.value[currentIdx]) {
    return incomePiePaths.value[currentIdx];
  }
  return null;
});

// Donut Chart SVG Arc Calculation Helper
const generatePiePaths = (items, totalSum) => {
  if (!totalSum || items.length === 0) return [];

  const cx = 100;
  const cy = 100;
  const outerR = 86;
  const innerR = 74;
  const hitOuterR = 98;
  const hitInnerR = 62;

  let currentAngle = -Math.PI / 2;

  return items.map((item, idx) => {
    const fraction = item.total / totalSum;
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
      amount: item.total,
      percentage,
      d: createArcPath(outerR, innerR),
      hitD: createArcPath(hitOuterR, hitInnerR),
      originalIndex: idx
    };
  });
};

const expensePiePaths = computed(() => {
  return generatePiePaths(filteredCategoryExpenses.value, totalFilteredCategoryExpense.value);
});

const activeExpenseLegendItems = computed(() => {
  const items = expensePiePaths.value;
  const currentIdx = activeExpenseIndex.value;
  if (currentIdx === null) return items;
  const selectedItem = items.find(it => it.originalIndex === currentIdx);
  if (!selectedItem) return items;
  const rest = items.filter(it => it.originalIndex !== currentIdx);
  return [selectedItem, ...rest];
});

const incomePiePaths = computed(() => {
  return generatePiePaths(filteredCategoryIncome.value, totalFilteredCategoryIncome.value);
});

const activeIncomeLegendItems = computed(() => {
  const items = incomePiePaths.value;
  const currentIdx = activeIncomeIndex.value;
  if (currentIdx === null) return items;
  const selectedItem = items.find(it => it.originalIndex === currentIdx);
  if (!selectedItem) return items;
  const rest = items.filter(it => it.originalIndex !== currentIdx);
  return [selectedItem, ...rest];
});

// Transaction Modal State & Logic
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

const confirmDelete = (tx) => {
  if (confirm(`Are you sure you want to delete "${tx.description || 'this transaction'}"?`)) {
    emit('delete-transaction', tx.id);
  }
};

// Helper Lookup Methods
const getCategoryName = (id) => {
  const cat = props.categories.find(c => c.id === id);
  return cat ? cat.name : 'Uncategorized';
};

const getCategoryColor = (id) => {
  const cat = props.categories.find(c => c.id === id);
  return cat ? cat.color : '#64748b';
};

const getAccountName = (id) => {
  const acc = props.accounts.find(a => a.id === id);
  return acc ? acc.name : 'Unknown Account';
};

const getBucketName = (id) => {
  if (!id) return 'General';
  const b = props.buckets.find(item => item.id === id);
  return b ? b.name : 'General';
};

const getBucketIcon = (id) => {
  if (!id) return '🪣';
  const b = props.buckets.find(item => item.id === id);
  return b?.icon || '🪣';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatAmount = (val) => {
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const transactionBadgeClass = (tx) => {
  if (tx.transaction_type === 'income') return 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30';
  if (tx.transaction_type === 'adjustment') return 'bg-[#d2bbff]/20 text-[#d2bbff] border border-[#d2bbff]/30';
  return 'bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/30';
};

const transactionAmountClass = (tx) => {
  if (tx.transaction_type === 'income') return 'text-[#4edea3]';
  if (tx.transaction_type === 'adjustment') return 'text-[#d2bbff]';
  return 'text-[#ffb4ab]';
};

const transactionSign = (tx) => {
  if (tx.transaction_type === 'income') return '+';
  if (tx.transaction_type === 'adjustment') return '±';
  return '-';
};

const transactionLabel = (tx) => {
  if (tx.transaction_type === 'income') return 'Income';
  if (tx.transaction_type === 'adjustment') return 'Adjustment';
  return 'Expense';
};
</script>

<style scoped>
.flip-list-move,
.flip-list-enter-active,
.flip-list-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Full Month Slide Out & Slide In Animations */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.28s ease;
}

/* Going Next: Old slide slides LEFT (-100%), new slide enters from RIGHT (100%) */
.slide-next-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.slide-next-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* Going Prev: Old slide slides RIGHT (100%), new slide enters from LEFT (-100%) */
.slide-prev-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}
.slide-prev-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
