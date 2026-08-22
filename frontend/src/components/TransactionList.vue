<template>
  <div 
    class="space-y-4 touch-pan-y"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @mousedown="onTouchStart"
    @mousemove="onTouchMove"
    @mouseup="onTouchEnd"
    @mouseleave="onTouchEnd"
  >
    <!-- Top Header & Controls Strip (Flush, Hairline Divider) -->
    <div class="border-b border-[#1f202e] pb-3 space-y-3">
      <!-- Centered Header: < Month Year > -->
      <div class="flex items-center justify-between px-1">
        <button 
          @click="prevMonth"
          class="w-7 h-7 rounded-lg bg-[#0f1019] hover:bg-[#141520] text-[#f1f0f5] flex items-center justify-center text-xs font-semibold transition cursor-pointer active:scale-95 border border-[#1f202e]"
          title="Previous Month"
        >
          ❮
        </button>

        <h2 class="text-base sm:text-lg font-bold text-[#f1f0f5] tracking-tight select-none">
          {{ formattedMonthYear }}
        </h2>

        <button 
          @click="nextMonth"
          class="w-7 h-7 rounded-lg bg-[#0f1019] hover:bg-[#141520] text-[#f1f0f5] flex items-center justify-center text-xs font-semibold transition cursor-pointer active:scale-95 border border-[#1f202e]"
          title="Next Month"
        >
          ❯
        </button>
      </div>

      <!-- Compact Controls Row -->
      <div class="flex items-center justify-between gap-1.5 flex-nowrap overflow-x-auto scrollbar-none py-0.5 px-1">
        <!-- Segmented Mode Toggle [ Monthly | Custom ▾ ] -->
        <div class="inline-flex p-0.5 bg-[#0f1019] border border-[#1f202e] rounded-lg text-[10px] font-semibold shrink-0">
          <button 
            @click="timeMode = 'monthly'"
            class="px-2.5 py-1 rounded-md transition cursor-pointer"
            :class="timeMode === 'monthly' ? 'bg-[#141520] text-[#f1f0f5] border border-[#D4BFFF]/40 shadow-sm' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
          >
            Monthly
          </button>
          <button 
            @click="openCustomRangeModal"
            class="px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1"
            :class="timeMode === 'range' ? 'bg-[#141520] text-[#D4BFFF] border border-[#D4BFFF]/40 shadow-sm' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
          >
            <span>Custom</span>
            <span class="text-[9px] text-[#D4BFFF]">▾</span>
          </button>
        </div>

        <!-- Filter, Sort & Chart View Mode Action Strip -->
        <div class="flex items-center gap-1.5 shrink-0 ml-auto">
          <!-- Choose Filters Button -->
          <button 
            @click="showFilterDrawer = !showFilterDrawer"
            class="h-7 px-2.5 bg-[#0f1019] hover:bg-[#141520] border border-[#1f202e] hover:border-[#D4BFFF]/60 rounded-lg text-[10px] font-semibold text-[#D4BFFF] flex items-center justify-center gap-1 transition cursor-pointer"
            title="Toggle Filter Options"
          >
            <span class="material-symbols-outlined text-xs">filter_list</span>
            <span v-if="activeFilterCount > 0" class="px-1 py-0.1 rounded-full text-[8px] bg-[#D4BFFF] text-[#0f0f15] font-bold">
              {{ activeFilterCount }}
            </span>
          </button>

          <!-- Sort Selector Dropdown -->
          <div class="flex items-center gap-0.5 bg-[#0f1019] border border-[#1f202e] focus-within:border-[#D4BFFF] rounded-lg px-2 h-7 transition">
            <span class="material-symbols-outlined text-xs text-[#D4BFFF]">swap_vert</span>
            <select 
              v-model="sortBy"
              class="bg-transparent text-[#f1f0f5] text-[10px] font-semibold focus:outline-none cursor-pointer pr-0"
            >
              <option value="date_desc" class="bg-[#0c0d14] text-[#f1f0f5]">Newest</option>
              <option value="date_asc" class="bg-[#0c0d14] text-[#f1f0f5]">Oldest</option>
              <option value="amount_desc" class="bg-[#0c0d14] text-[#f1f0f5]">Highest</option>
              <option value="amount_asc" class="bg-[#0c0d14] text-[#f1f0f5]">Lowest</option>
            </select>
          </div>

          <!-- Chart View Mode -->
          <div class="inline-flex p-0.5 bg-[#0f1019] border border-[#1f202e] rounded-lg text-[9px] font-semibold shrink-0">
            <button 
              @click="chartViewMode = 'both'"
              class="px-2 py-0.5 rounded transition cursor-pointer"
              :class="chartViewMode === 'both' ? 'bg-[#D4BFFF] text-[#0f0f15] font-bold' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
              title="Show Both Expenses & Income Charts"
            >
              All
            </button>
            <button 
              @click="chartViewMode = 'expense'"
              class="px-2 py-0.5 rounded transition cursor-pointer"
              :class="chartViewMode === 'expense' ? 'bg-[#FFD1B3] text-[#0f0f15] font-bold' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
              title="Show Expenses Breakdown Chart Only"
            >
              Exp
            </button>
            <button 
              @click="chartViewMode = 'income'"
              class="px-2 py-0.5 rounded transition cursor-pointer"
              :class="chartViewMode === 'income' ? 'bg-[#B3F5E1] text-[#0f0f15] font-bold' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
              title="Show Income Breakdown Chart Only"
            >
              Inc
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sleek Custom Time Range & Month/Year Pop-up Modal Sheet -->
    <Transition name="fade-slide">
      <div v-if="showCustomRangeModal" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-20 sm:pb-4 bg-black/75 backdrop-blur-md">
        <div class="relative w-full max-w-md bg-[#0c0d14] border border-[#1f202e] rounded-2xl shadow-2xl overflow-hidden flex flex-col p-4 space-y-3.5">
          
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-[#1f202e] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-[#D4BFFF]">calendar_month</span>
              <h3 class="text-sm font-bold text-[#f1f0f5] tracking-tight">Select Time Range Horizon</h3>
            </div>
            <button @click="showCustomRangeModal = false" class="text-[#9e9cae] hover:text-[#f1f0f5] transition cursor-pointer p-1">
              <span class="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <!-- 1-Tap Preset Chip Options -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">Quick Presets</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                type="button"
                @click="selectRangeChoice('this_month')"
                class="px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer"
                :class="rangeTimeChoice === 'this_month' ? 'bg-[#D4BFFF] text-[#0f0f15] border-[#D4BFFF] font-bold' : 'bg-[#0f1019] border-[#1f202e] text-[#f1f0f5] hover:border-[#D4BFFF]/40'"
              >
                This Month
              </button>
              <button
                type="button"
                @click="selectRangeChoice('last_month')"
                class="px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer"
                :class="rangeTimeChoice === 'last_month' ? 'bg-[#D4BFFF] text-[#0f0f15] border-[#D4BFFF] font-bold' : 'bg-[#0f1019] border-[#1f202e] text-[#f1f0f5] hover:border-[#D4BFFF]/40'"
              >
                Last Month
              </button>
              <button
                type="button"
                @click="selectRangeChoice('last_3_months')"
                class="px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer"
                :class="rangeTimeChoice === 'last_3_months' ? 'bg-[#D4BFFF] text-[#0f0f15] border-[#D4BFFF] font-bold' : 'bg-[#0f1019] border-[#1f202e] text-[#f1f0f5] hover:border-[#D4BFFF]/40'"
              >
                Last 3 Months
              </button>
              <button
                type="button"
                @click="selectRangeChoice('last_6_months')"
                class="px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer"
                :class="rangeTimeChoice === 'last_6_months' ? 'bg-[#D4BFFF] text-[#0f0f15] border-[#D4BFFF] font-bold' : 'bg-[#0f1019] border-[#1f202e] text-[#f1f0f5] hover:border-[#D4BFFF]/40'"
              >
                Last 6 Months
              </button>
              <button
                type="button"
                @click="selectRangeChoice('this_year')"
                class="px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer"
                :class="rangeTimeChoice === 'this_year' ? 'bg-[#D4BFFF] text-[#0f0f15] border-[#D4BFFF] font-bold' : 'bg-[#0f1019] border-[#1f202e] text-[#f1f0f5] hover:border-[#D4BFFF]/40'"
              >
                This Year
              </button>
              <button
                type="button"
                @click="rangeTimeChoice = 'specific_month'"
                class="px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                :class="rangeTimeChoice === 'specific_month' ? 'bg-[#D4BFFF] text-[#0f0f15] border-[#D4BFFF] font-bold' : 'bg-[#0f1019] border-[#1f202e] text-[#f1f0f5] hover:border-[#D4BFFF]/40'"
              >
                <span class="material-symbols-outlined text-sm">calendar_month</span>
                <span>Month/Year Grid</span>
              </button>
              <button
                type="button"
                @click="rangeTimeChoice = 'custom'"
                class="px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer"
                :class="rangeTimeChoice === 'custom' ? 'bg-[#D4BFFF] text-[#0f0f15] border-[#D4BFFF] font-bold' : 'bg-[#0f1019] border-[#1f202e] text-[#f1f0f5] hover:border-[#D4BFFF]/40'"
              >
                Custom Dates...
              </button>
            </div>
          </div>

          <!-- Sleek Month/Year Matrix Picker -->
          <div v-if="rangeTimeChoice === 'specific_month'" class="p-3 bg-[#0f1019] border border-[#1f202e] rounded-xl space-y-2.5">
            <div class="flex items-center justify-between border-b border-[#1f202e] pb-2">
              <button 
                type="button"
                @click="changePickerYear(-1)"
                class="w-7 h-7 rounded-lg bg-[#141520] hover:bg-[#191924] text-[#f1f0f5] flex items-center justify-center text-xs font-bold border border-[#1f202e] transition cursor-pointer"
              >
                ❮
              </button>
              <span class="text-sm font-bold text-[#D4BFFF]">{{ pickerYear }}</span>
              <button 
                type="button"
                @click="changePickerYear(1)"
                class="w-7 h-7 rounded-lg bg-[#141520] hover:bg-[#191924] text-[#f1f0f5] flex items-center justify-center text-xs font-bold border border-[#1f202e] transition cursor-pointer"
              >
                ❯
              </button>
            </div>

            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="(mName, idx) in monthNames"
                :key="mName"
                type="button"
                @click="selectMonthAndYearModal(idx)"
                class="py-2 rounded-lg border text-xs font-bold transition cursor-pointer text-center"
                :class="isCurrentSelectedMonth(idx) ? 'bg-[#D4BFFF] text-[#0f0f15] border-[#D4BFFF]' : 'bg-[#141520] border-[#1f202e] text-[#f1f0f5] hover:bg-[#191924]'"
              >
                {{ mName }}
              </button>
            </div>
          </div>

          <!-- Custom Date Range Inputs -->
          <div v-if="rangeTimeChoice === 'custom'" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#1f202e]">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider">Start Date</label>
              <input 
                v-model="startDateInput"
                type="date"
                @click="$event.target.showPicker?.()"
                class="w-full h-8 px-2.5 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-lg text-[#f1f0f5] text-xs focus:outline-none transition cursor-pointer [color-scheme:dark]"
              />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider">End Date</label>
              <input 
                v-model="endDateInput"
                type="date"
                @click="$event.target.showPicker?.()"
                class="w-full h-8 px-2.5 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-lg text-[#f1f0f5] text-xs focus:outline-none transition cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>

          <!-- Modal Action Footer -->
          <div class="pt-2 border-t border-[#1f202e] flex items-center justify-end gap-2">
            <button
              type="button"
              @click="showCustomRangeModal = false"
              class="px-5 py-2 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              Apply Range
            </button>
          </div>

        </div>
      </div>
    </Transition>

    <!-- Sleek UI Filter Modal Prompt Sheet -->
    <Transition name="fade-slide">
      <div v-if="showFilterDrawer" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-20 sm:pb-4 bg-black/75 backdrop-blur-md">
        <div class="relative w-full max-w-lg bg-[#0c0d14] border border-[#1f202e] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[72vh] sm:max-h-[80vh]">
          
          <!-- Modal Header -->
          <div class="px-5 py-3 border-b border-[#1f202e] flex justify-between items-center bg-[#0c0d14] shrink-0">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-[#D4BFFF]">search</span>
              <h3 class="text-sm font-bold text-[#f1f0f5] tracking-tight">Filter & Search Transactions</h3>
              <span v-if="activeFilterCount > 0" class="px-2 py-0.5 rounded-full text-[9px] bg-[#D4BFFF] text-[#0f0f15] font-bold">
                {{ activeFilterCount }} active
              </span>
            </div>
            <button 
              @click="showFilterDrawer = false" 
              class="text-[#9e9cae] hover:text-[#f1f0f5] transition cursor-pointer p-1"
              title="Close Filters"
            >
              <span class="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <!-- Modal Body (Scrollable with compact spacing) -->
          <div class="p-3.5 sm:p-4 space-y-3 overflow-y-auto flex-1 overscroll-contain">
            
            <!-- Search Input -->
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">Search</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-2 text-[#9e9cae] text-sm">search</span>
                <input 
                  v-model="filters.search"
                  type="text" 
                  placeholder="Search description or notes..."
                  class="w-full pl-8 pr-8 py-1.5 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs placeholder-[#9e9cae]/60 focus:outline-none transition"
                />
                <button 
                  v-if="filters.search" 
                  @click="filters.search = ''"
                  class="absolute right-3 top-2 text-[#9e9cae] hover:text-[#f1f0f5]"
                >
                  <span class="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>

            <!-- Savings Buckets Table Grid Matrix -->
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">Savings Buckets</label>
                <div class="flex items-center gap-2 text-[10px] font-bold">
                  <button type="button" @click="selectAllBuckets" class="text-[#D4BFFF] hover:underline cursor-pointer">Select All</button>
                  <span class="text-[#1f202e]">|</span>
                  <button type="button" @click="deselectAllBuckets" class="text-[#9e9cae] hover:text-[#FFD1B3] hover:underline cursor-pointer">Clear</button>
                </div>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-0.5">
                <button
                  type="button"
                  @click="deselectAllBuckets"
                  class="px-2 py-1.5 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between gap-1.5 h-8"
                  :class="filters.bucket_ids.length === 0 ? 'bg-[#D4BFFF]/20 border-[#D4BFFF] text-[#D4BFFF] font-bold' : 'bg-[#0f1019] border-[#1f202e] text-[#9e9cae] hover:border-[#D4BFFF]/40'"
                >
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="material-symbols-outlined text-xs">savings</span>
                    <span class="truncate text-[11px]">All Buckets</span>
                  </div>
                </button>
                <button
                  v-for="b in buckets"
                  :key="b.id"
                  type="button"
                  @click="toggleBucketFilter(b.id)"
                  class="px-2 py-1.5 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between gap-1.5 h-8"
                  :class="filters.bucket_ids.includes(b.id) ? 'bg-[#D4BFFF]/20 border-[#D4BFFF] text-[#D4BFFF] font-bold' : 'bg-[#0f1019] border-[#1f202e] text-[#9e9cae] hover:border-[#D4BFFF]/40'"
                >
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="material-symbols-outlined text-xs leading-none shrink-0" :style="{ color: b.color || '#D4BFFF' }">{{ resolveIcon(b.icon, 'savings') }}</span>
                    <span class="truncate text-[11px]">{{ b.name }}</span>
                  </div>
                  <span v-if="filters.bucket_ids.includes(b.id)" class="material-symbols-outlined text-xs text-[#D4BFFF] shrink-0">check</span>
                </button>
              </div>
            </div>

            <!-- Storage Accounts Table Grid Matrix -->
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">Storage Accounts</label>
                <div class="flex items-center gap-2 text-[10px] font-bold">
                  <button type="button" @click="selectAllAccounts" class="text-[#D4BFFF] hover:underline cursor-pointer">Select All</button>
                  <span class="text-[#1f202e]">|</span>
                  <button type="button" @click="deselectAllAccounts" class="text-[#9e9cae] hover:text-[#FFD1B3] hover:underline cursor-pointer">Clear</button>
                </div>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto p-0.5">
                <button
                  type="button"
                  @click="deselectAllAccounts"
                  class="px-2 py-1.5 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between gap-1.5 h-8"
                  :class="filters.account_ids.length === 0 ? 'bg-[#D4BFFF]/20 border-[#D4BFFF] text-[#D4BFFF] font-bold' : 'bg-[#0f1019] border-[#1f202e] text-[#9e9cae] hover:border-[#D4BFFF]/40'"
                >
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="material-symbols-outlined text-xs">account_balance</span>
                    <span class="truncate text-[11px]">All Accounts</span>
                  </div>
                </button>
                <button
                  v-for="acc in accounts"
                  :key="acc.id"
                  type="button"
                  @click="toggleAccountFilter(acc.id)"
                  class="px-2 py-1.5 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between gap-1.5 h-8"
                  :class="filters.account_ids.includes(acc.id) ? 'bg-[#D4BFFF]/20 border-[#D4BFFF] text-[#D4BFFF] font-bold' : 'bg-[#0f1019] border-[#1f202e] text-[#9e9cae] hover:border-[#D4BFFF]/40'"
                >
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="truncate text-[11px]">{{ acc.name }}</span>
                  </div>
                  <span v-if="filters.account_ids.includes(acc.id)" class="material-symbols-outlined text-xs text-[#D4BFFF] shrink-0">check</span>
                </button>
              </div>
            </div>

            <!-- Categories Table Grid Matrix -->
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">Categories</label>
                <div class="flex items-center gap-2 text-[10px] font-bold">
                  <button type="button" @click="selectAllCategories" class="text-[#D4BFFF] hover:underline cursor-pointer">Select All</button>
                  <span class="text-[#1f202e]">|</span>
                  <button type="button" @click="deselectAllCategories" class="text-[#9e9cae] hover:text-[#FFD1B3] hover:underline cursor-pointer">Clear</button>
                </div>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 bg-[#0f1019] border border-[#1f202e] rounded-xl">
                <button
                  v-for="cat in filteredCategories"
                  :key="cat.id"
                  type="button"
                  @click="toggleCategoryFilter(cat.id)"
                  class="px-2 py-1.5 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between gap-1.5 h-8"
                  :class="filters.category_ids.includes(cat.id) ? 'bg-[#D4BFFF]/20 border-[#D4BFFF] text-[#D4BFFF] font-bold' : 'bg-[#141520] border-[#1f202e] text-[#9e9cae] hover:border-[#D4BFFF]/40'"
                >
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="material-symbols-outlined text-xs leading-none shrink-0" :style="{ color: cat.color || '#D4BFFF' }">{{ resolveIcon(cat.icon, 'category') }}</span>
                    <span class="truncate text-[11px]">{{ cat.name }}</span>
                  </div>
                  <span v-if="filters.category_ids.includes(cat.id)" class="material-symbols-outlined text-xs text-[#D4BFFF] shrink-0">check</span>
                </button>
              </div>
            </div>

                <!-- Transaction Type Structured Table Row -->
                <div class="space-y-1">
                  <label class="text-[10px] font-semibold text-[#9e9cae] uppercase tracking-wider block">Transaction Type</label>
                  <div class="grid grid-cols-4 gap-1 p-0.5 bg-[#0f0f15] rounded-xl border border-[#29293a]">
                    <button
                      type="button"
                      @click="filters.transaction_type = ''"
                      class="py-1 text-xs font-semibold rounded-lg transition cursor-pointer text-center"
                      :class="!filters.transaction_type ? 'bg-[#14141d] text-[#f1f0f5] border border-[#29293a]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      @click="filters.transaction_type = 'expense'"
                      class="py-1 text-xs font-semibold rounded-lg transition cursor-pointer text-center"
                      :class="filters.transaction_type === 'expense' ? 'bg-[#FFD1B3] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      @click="filters.transaction_type = 'income'"
                      class="py-1 text-xs font-semibold rounded-lg transition cursor-pointer text-center"
                      :class="filters.transaction_type === 'income' ? 'bg-[#B3F5E1] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
                    >
                      Income
                    </button>
                    <button
                      type="button"
                      @click="filters.transaction_type = 'adjustment'"
                      class="py-1 text-xs font-semibold rounded-lg transition cursor-pointer text-center"
                      :class="filters.transaction_type === 'adjustment' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
                    >
                      Adjust
                    </button>
                  </div>
                </div>

              </div>

              <!-- Modal Footer Action Strip -->
              <div class="p-3 border-t border-[#29293a] bg-[#14141d] flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  @click="resetAllFilters"
                  class="px-3 py-1.5 text-xs font-semibold text-[#9e9cae] hover:text-[#FFD1B3] transition cursor-pointer"
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  @click="showFilterDrawer = false"
                  class="px-5 py-2 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-semibold text-xs rounded-full shadow-md transition cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>

            </div>
          </div>
        </Transition>

    <!-- Dual Expenses & Income Donut Charts Container with Full Slide Transition -->
    <div class="overflow-hidden">
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
          <!-- Expenses Breakdown Donut Chart Card -->
          <section 
            v-if="chartViewMode === 'both' || chartViewMode === 'expense'"
            class="bg-[#0f1019] border border-[#1f202e] rounded-xl p-4 space-y-4"
          >
            <div class="border-b border-[#1f202e] pb-2">
              <h2 class="text-sm font-bold text-[#f1f0f5] tracking-tight">Expenses Breakdown</h2>
            </div>

            <div v-if="expensePiePaths.length === 0" class="p-8 text-center text-xs font-semibold text-[#9e9cae]">
              No expense records found for this period.
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-2">
              <!-- SVG Donut Ring -->
              <div class="md:col-span-6 flex items-center justify-center">
                <div class="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center shrink-0">
                  <svg class="w-full h-full overflow-visible" viewBox="-30 -30 260 260">
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
                    <span class="text-xs font-semibold text-[#9e9cae] truncate max-w-[130px]">
                      {{ activeHoveredExpenseInfo ? activeHoveredExpenseInfo.name : 'Total Spent' }}
                    </span>
                    <div class="text-xl sm:text-2xl font-black text-[#f1f0f5] tabular-nums tracking-tight mt-0.5">
                      <span class="text-sm text-[#9e9cae] font-bold">₹</span>{{ formatAmount(activeHoveredExpenseInfo ? activeHoveredExpenseInfo.amount : totalFilteredCategoryExpense) }}
                    </div>
                    <span v-if="activeHoveredExpenseInfo" class="text-xs font-bold text-[#FFD1B3] mt-0.5 px-2 py-0.5 rounded-full bg-[#FFD1B3]/10 border border-[#FFD1B3]/20">
                      {{ activeHoveredExpenseInfo.percentage }}% of total
                    </span>
                  </div>
                </div>
              </div>

              <!-- Interactive Borderless Legend List -->
              <TransitionGroup 
                name="flip-list" 
                tag="div" 
                class="md:col-span-6 space-y-1.5 max-h-56 overflow-y-auto p-1"
              >
                <div 
                  v-for="item in activeExpenseLegendItems"
                  :key="item.name"
                  @mouseenter="hoveredExpenseIndex = item.originalIndex"
                  @mouseleave="hoveredExpenseIndex = null"
                  @click="toggleSelectExpenseCategory(item.originalIndex)"
                  class="flex items-center justify-between py-2 px-2.5 rounded-xl border border-transparent transition-all duration-200 cursor-pointer hover:bg-[#141520] hover:border-[#1f202e]"
                  :class="activeExpenseIndex === item.originalIndex ? 'bg-[#141520] border-[#D4BFFF]/50 ring-1 ring-[#D4BFFF]/40' : ''"
                >
                  <!-- Left: Material Symbol Icon + Category Name -->
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span 
                      class="material-symbols-outlined text-xs leading-none shrink-0 transition-transform duration-200"
                      :style="{ 
                        color: item.color,
                        filter: activeExpenseIndex === item.originalIndex ? `drop-shadow(0 0 4px ${item.color})` : 'none' 
                      }"
                    >
                      {{ resolveIcon(item.icon, 'category') }}
                    </span>
                    <span class="text-xs font-bold text-[#f1f0f5] truncate leading-none">{{ item.name }}</span>
                  </div>

                  <!-- Right: Percentage Badge + Amount -->
                  <div class="flex items-center gap-2.5 shrink-0 tabular-nums">
                    <span class="text-[10px] font-bold text-[#9e9cae] bg-[#141520] px-2 py-0.5 rounded-md border border-[#1f202e]">{{ item.percentage }}%</span>
                    <span class="text-xs sm:text-sm font-bold text-[#f1f0f5]">
                      ₹{{ formatAmount(item.amount) }}
                    </span>
                  </div>
                </div>
              </TransitionGroup>
            </div>
          </section>

          <!-- Income Breakdown Donut Chart Card -->
          <section 
            v-if="chartViewMode === 'both' || chartViewMode === 'income'"
            class="bg-[#0f1019] border border-[#1f202e] rounded-xl p-4 space-y-4"
          >
            <div class="border-b border-[#1f202e] pb-2">
              <h2 class="text-sm font-bold text-[#f1f0f5] tracking-tight">Income Breakdown</h2>
            </div>

            <div v-if="incomePiePaths.length === 0" class="p-8 text-center text-xs font-semibold text-[#9e9cae]">
              No income records found for this period.
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-2">
              <!-- SVG Donut Ring -->
              <div class="md:col-span-6 flex items-center justify-center">
                <div class="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center shrink-0">
                  <svg class="w-full h-full overflow-visible" viewBox="-30 -30 260 260">
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
                    <span class="text-xs font-semibold text-[#9e9cae] truncate max-w-[130px]">
                      {{ activeHoveredIncomeInfo ? activeHoveredIncomeInfo.name : 'Income' }}
                    </span>
                    <div class="text-xl sm:text-2xl font-bold text-[#B3F5E1] tabular-nums tracking-tight mt-0.5">
                      <span class="text-sm text-[#9e9cae] font-bold">₹</span>{{ formatAmount(activeHoveredIncomeInfo ? activeHoveredIncomeInfo.amount : totalFilteredCategoryIncome) }}
                    </div>
                    <span v-if="activeHoveredIncomeInfo" class="text-xs font-bold text-[#B3F5E1] mt-0.5 px-2 py-0.5 rounded-full bg-[#B3F5E1]/10 border border-[#B3F5E1]/20">
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
                  class="flex items-center justify-between py-1.5 px-2 rounded-xl border border-transparent transition-all duration-200 cursor-pointer hover:bg-[#141520] hover:border-[#1f202e]"
                  :class="activeIncomeIndex === item.originalIndex ? 'bg-[#141520] border-[#B3F5E1]/50 ring-1 ring-[#B3F5E1]/40' : ''"
                >
                  <!-- Left: Material Symbol Icon + Category Name -->
                  <div class="flex items-center gap-2 min-w-0">
                    <span 
                      class="material-symbols-outlined text-xs leading-none shrink-0 transition-transform duration-200"
                      :style="{ 
                        color: item.color,
                        filter: activeIncomeIndex === item.originalIndex ? `drop-shadow(0 0 4px ${item.color})` : 'none' 
                      }"
                    >
                      {{ resolveIcon(item.icon, 'category') }}
                    </span>
                    <span class="text-xs font-bold text-[#f1f0f5] truncate leading-none">{{ item.name }}</span>
                  </div>

                  <!-- Right: Percentage + Amount -->
                  <div class="flex items-center gap-2 shrink-0 tabular-nums">
                    <span class="text-[10px] font-semibold text-[#9e9cae] bg-[#141520] px-1.5 py-0.2 rounded-md border border-[#1f202e]">{{ item.percentage }}%</span>
                    <span class="text-xs font-bold text-[#B3F5E1]">
                      ₹{{ formatAmount(item.amount) }}
                    </span>
                  </div>
                </div>
              </TransitionGroup>
            </div>
          </section>
        </div>
      </Transition>
    </div>



    <!-- 4. Grouped Transaction Records List (Flush, Hairline Dividers) -->
    <div id="history-records-section" v-if="displayedTransactions.length > 0" class="space-y-4">
      <div 
        v-for="group in groupedTransactionsByDate" 
        :key="group.dateStr" 
        class="space-y-0"
      >
        <!-- Group Date Header (Flush, sticky background) -->
        <div class="flex items-center justify-between px-1 py-2 border-b border-[#1f202e] text-xs font-semibold sticky top-13 z-10 bg-[#0c0d14]/95 backdrop-blur-md">
          <span class="text-[#f1f0f5] font-bold tracking-tight">{{ formatDateHeader(group.dateStr) }}</span>
          <div class="flex items-center gap-2 tabular-nums text-xs font-semibold">
            <span v-if="group.totalExpense > 0" class="text-[#9e9cae]">Spent: <span class="text-[#f1f0f5]">₹{{ formatAmount(group.totalExpense) }}</span></span>
            <span v-if="group.totalIncome > 0" class="text-[#B3F5E1]">Income: ₹{{ formatAmount(group.totalIncome) }}</span>
          </div>
        </div>

        <!-- Group Records Hairline List -->
        <div class="divide-y divide-[#1f202e] border-b border-[#1f202e]">
          <div 
            v-for="tx in group.transactions" 
            :key="tx.id" 
            @click="viewTransactionDetails(tx)"
            class="py-3 px-1 hover:bg-[#141520] transition cursor-pointer flex items-center justify-between gap-3 min-h-[48px] active:bg-[#141520]"
          >
            <!-- Left: Square Icon Tile & Description -->
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="w-8 h-8 rounded-lg bg-[#141520] border border-[#1f202e] flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-base leading-none" :style="{ color: getCategoryColor(tx.category_id) }">{{ resolveIcon(getBucketIcon(tx.bucket_id) !== '🪣' ? getBucketIcon(tx.bucket_id) : getCategoryIcon(tx.category_id), 'savings') }}</span>
              </div>

              <!-- Center: Description & Metadata -->
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-[#f1f0f5] truncate leading-tight">{{ tx.description || 'No description' }}</p>
                <div class="flex items-center gap-1.5 text-[10px] text-[#9e9cae] truncate mt-0.5">
                  <span class="inline-flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: getCategoryColor(tx.category_id) }"></span>
                    <span class="truncate font-medium text-[#9e9cae]">{{ getCategoryName(tx.category_id) }}</span>
                  </span>
                  <span>•</span>
                  <span class="truncate text-[#9e9cae] font-medium">{{ getAccountName(tx.account_id) }}</span>
                </div>
              </div>
            </div>

            <!-- Right: Amount & Actions -->
            <div class="flex items-center gap-2 shrink-0 text-right">
              <span class="text-xs sm:text-sm font-bold block tabular-nums" :class="transactionAmountClass(tx)">
                {{ transactionSign(tx) }}₹{{ formatAmount(tx.amount) }}
              </span>

              <!-- Desktop Action Buttons -->
              <div class="hidden sm:flex gap-1 items-center ml-1">
                <button @click.stop="$emit('edit-transaction', tx)" class="p-1 text-[#D4BFFF] hover:text-white transition cursor-pointer" title="Edit">
                  <span class="material-symbols-outlined text-sm">edit</span>
                </button>
                <button @click.stop="confirmDelete(tx)" class="p-1 text-[#FFD1B3] hover:text-rose-300 transition cursor-pointer" title="Delete">
                  <span class="material-symbols-outlined text-sm">delete</span>
                </button>
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
                  <span class="material-symbols-outlined text-xs leading-none" :style="{ color: getBucketColor(tx.bucket_id) }">{{ resolveIcon(getBucketIcon(tx.bucket_id), 'savings') }}</span>
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

    <!-- 6. Transaction Details Modal Sheet (Hairline Divide with Smooth Spring Transition) -->
    <Transition name="modal-sheet">
      <div 
        v-if="selectedTransactionForView"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md pb-16 sm:pb-0"
        @click.self="closeViewModal"
      >
        <div class="modal-sheet-card relative w-full max-w-md bg-[#0c0d14] border-t sm:border border-[#1f202e] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] my-0 sm:my-auto">
          <!-- Modal Header -->
          <div class="flex justify-between items-center px-5 py-3.5 border-b border-[#1f202e] bg-[#0c0d14]">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-[#141520] border border-[#1f202e] flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-base leading-none" :style="{ color: getBucketColor(selectedTransactionForView.bucket_id) }">{{ resolveIcon(getBucketIcon(selectedTransactionForView.bucket_id), 'savings') }}</span>
              </div>
              <div>
                <h3 class="text-sm font-bold text-[#f1f0f5]">
                  {{ isEditingInModal ? 'Edit Transaction' : 'Transaction Details' }}
                </h3>
                <p class="text-[10px] text-[#9e9cae]">
                  {{ isEditingInModal ? 'Update transaction details below' : 'Complete record breakdown' }}
                </p>
              </div>
            </div>
            <button 
              @click="closeViewModal"
              class="text-[#9e9cae] hover:text-[#f1f0f5] transition cursor-pointer p-1"
            >
              <span class="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <!-- Modal Body (View Mode) -->
          <div v-if="!isEditingInModal" class="p-5 space-y-4">
            <div class="bg-[#0f1019] border border-[#1f202e] rounded-xl p-4 text-center space-y-1">
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
              <p class="text-xs font-bold text-[#f1f0f5] break-words pt-1">
                {{ selectedTransactionForView.description || 'No Description' }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-2.5 text-xs">
              <div class="bg-[#0f1019] border border-[#1f202e] rounded-xl p-3 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#9e9cae]">Category</span>
                <div class="flex items-center gap-1.5 pt-0.5">
                  <span class="material-symbols-outlined text-sm leading-none shrink-0" :style="{ color: getCategoryColor(selectedTransactionForView.category_id) }">{{ resolveIcon(getCategoryIcon(selectedTransactionForView.category_id), 'category') }}</span>
                  <span class="font-bold text-[#f1f0f5] break-words">{{ getCategoryName(selectedTransactionForView.category_id) }}</span>
                </div>
              </div>

              <div class="bg-[#0f1019] border border-[#1f202e] rounded-xl p-3 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#9e9cae]">Date</span>
                <p class="font-bold text-[#f1f0f5] pt-0.5">{{ formatDate(selectedTransactionForView.date) }}</p>
              </div>

              <div class="bg-[#0f1019] border border-[#1f202e] rounded-xl p-3 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#9e9cae]">Storage Account</span>
                <p class="font-bold text-[#f1f0f5] break-words pt-0.5">{{ getAccountName(selectedTransactionForView.account_id) }}</p>
              </div>

              <div class="bg-[#0f1019] border border-[#1f202e] rounded-xl p-3 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#9e9cae]">Bucket</span>
                <div class="flex items-center gap-1.5 pt-0.5">
                  <span class="material-symbols-outlined text-sm leading-none shrink-0" :style="{ color: getBucketColor(selectedTransactionForView.bucket_id) }">{{ resolveIcon(getBucketIcon(selectedTransactionForView.bucket_id), 'savings') }}</span>
                  <span class="font-bold text-[#f1f0f5] break-words">{{ getBucketName(selectedTransactionForView.bucket_id) }}</span>
                </div>
              </div>
            </div>

            <div class="bg-[#0f1019] border border-[#1f202e] rounded-xl p-3 space-y-1 text-xs">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#9e9cae]">Additional Notes / Description</span>
              <p v-if="selectedTransactionForView.notes" class="text-[#f1f0f5] leading-relaxed break-words pt-0.5 font-medium">
                {{ selectedTransactionForView.notes }}
              </p>
              <p v-else class="text-[#9e9cae]/50 italic text-xs font-medium pt-0.5">
                N/A
              </p>
            </div>
          </div>

          <!-- Modal Body (Inline Edit Mode) -->
          <div v-else class="p-4 space-y-3">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider">Description / Title</label>
              <input 
                v-model="editForm.description"
                type="text"
                placeholder="e.g. Dinner, Grocery Shopping..."
                class="w-full h-8 px-2.5 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-lg text-xs text-[#f1f0f5] placeholder-[#9e9cae]/40 focus:outline-none transition"
              />
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider">Amount (₹)</label>
                <input 
                  v-model.number="editForm.amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  class="w-full h-8 px-2.5 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-lg text-xs text-[#f1f0f5] placeholder-[#9e9cae]/40 focus:outline-none transition tabular-nums"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider">Type</label>
                <select 
                  v-model="editForm.transaction_type"
                  class="w-full h-8 px-2 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-lg text-xs text-[#f1f0f5] focus:outline-none transition cursor-pointer"
                >
                  <option value="expense" class="bg-[#0c0d14]">Expense</option>
                  <option value="income" class="bg-[#0c0d14]">Income</option>
                  <option value="adjustment" class="bg-[#0c0d14]">Adjustment</option>
                  <option value="transfer" class="bg-[#0c0d14]">Transfer</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <CategoryPicker 
                :categories="categories" 
                v-model="editForm.category_id" 
                label="Category" 
                title="Select Category"
                placeholder="Choose Category"
              />
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider">Storage Account</label>
                <select 
                  v-model="editForm.account_id"
                  class="w-full h-8 px-2 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-lg text-xs text-[#f1f0f5] focus:outline-none transition cursor-pointer"
                >
                  <option v-for="acc in accounts" :key="acc.id" :value="acc.id" class="bg-[#0c0d14]">
                    {{ acc.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider">Savings Bucket</label>
                <select 
                  v-model="editForm.bucket_id"
                  class="w-full h-8 px-2 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-lg text-xs text-[#f1f0f5] focus:outline-none transition cursor-pointer"
                >
                  <option value="" class="bg-[#0c0d14]">No Bucket</option>
                  <option v-for="b in buckets" :key="b.id" :value="b.id" class="bg-[#0c0d14]">
                    {{ b.name }}
                  </option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider">Date</label>
                <input 
                  v-model="editForm.date"
                  type="date"
                  @click="$event.target.showPicker?.()"
                  class="w-full h-8 px-2.5 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-lg text-xs text-[#f1f0f5] focus:outline-none transition cursor-pointer [color-scheme:dark]"
                />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider">Additional Notes</label>
              <textarea 
                v-model="editForm.notes"
                rows="2"
                placeholder="Add optional transaction notes..."
                class="w-full p-2 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-lg text-xs text-[#f1f0f5] placeholder-[#9e9cae]/40 focus:outline-none transition"
              ></textarea>
            </div>
          </div>

          <!-- Modal Footer Actions (View Mode) -->
          <div v-if="!isEditingInModal" class="flex items-center gap-2.5 p-3.5 bg-[#0c0d14] border-t border-[#1f202e]">
            <button 
              @click="startModalEdit" 
              class="flex-1 h-9 px-3 rounded-xl bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <span class="material-symbols-outlined text-sm">edit</span>
              <span>Edit Record</span>
            </button>
            <button 
              @click="deleteFromModal" 
              class="h-9 px-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs font-bold hover:bg-rose-900/40 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span class="material-symbols-outlined text-sm">delete</span>
              <span>Delete</span>
            </button>
          </div>

          <!-- Modal Footer Actions (Inline Edit Mode) -->
          <div v-else class="flex items-center justify-between gap-2 p-3.5 bg-[#0c0d14] border-t border-[#1f202e]">
            <button 
              @click="deleteFromModal" 
              class="h-8 px-2.5 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs font-bold hover:bg-rose-900/40 transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span class="material-symbols-outlined text-sm">delete</span>
              <span>Delete</span>
            </button>
            <div class="flex items-center gap-2">
              <button 
                @click="cancelModalEdit" 
                class="h-8 px-3 rounded-lg bg-[#0f1019] border border-[#1f202e] text-[#9e9cae] text-xs font-bold hover:text-[#f1f0f5] transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                @click="saveModalEdit" 
                class="h-8 px-3.5 rounded-lg bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-md"
              >
                <span class="material-symbols-outlined text-sm">check</span>
                <span>Save Changes</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import CategoryPicker from './CategoryPicker.vue';
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
const filteredCategories = computed(() => props.categories.filter(c => c.name !== 'Uncategorized'));
const showFilterDrawer = ref(false);
const sortBy = ref('date_desc'); // 'date_desc', 'date_asc', 'amount_desc', 'amount_asc'
const filters = ref({
  search: '',
  bucket_ids: [],
  account_ids: [],
  category_ids: [],
  transaction_type: ''
});

// Sleek Custom Range Modal State & Methods
const showCustomRangeModal = ref(false);
const pickerYear = ref(new Date().getFullYear());
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const openCustomRangeModal = () => {
  timeMode.value = 'range';
  pickerYear.value = currentMonthDate.value.getFullYear();
  showCustomRangeModal.value = true;
};

const selectRangeChoice = (choice) => {
  rangeTimeChoice.value = choice;
  showCustomRangeModal.value = false;
};

const changePickerYear = (delta) => {
  pickerYear.value += delta;
};

const selectMonthAndYearModal = (monthIndex) => {
  currentMonthDate.value = new Date(pickerYear.value, monthIndex, 1);
  showCustomRangeModal.value = false;
};

const isCurrentSelectedMonth = (idx) => {
  return currentMonthDate.value.getFullYear() === pickerYear.value && currentMonthDate.value.getMonth() === idx;
};

const jumpToThisMonth = () => {
  const now = new Date();
  currentMonthDate.value = new Date(now.getFullYear(), now.getMonth(), 1);
  pickerYear.value = now.getFullYear();
  showCustomRangeModal.value = false;
};

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
  if (filters.value.bucket_ids.length > 0) count += filters.value.bucket_ids.length;
  if (filters.value.account_ids.length > 0) count += filters.value.account_ids.length;
  if (filters.value.category_ids.length > 0) count += filters.value.category_ids.length;
  if (filters.value.transaction_type) count++;
  if (rangeTimeChoice.value === 'custom' && (startDateInput.value || endDateInput.value)) count++;
  return count;
});

const hasActiveFilters = computed(() => activeFilterCount.value > 0);

const clearFilters = () => {
  filters.value = {
    search: '',
    bucket_ids: [],
    account_ids: [],
    category_ids: [],
    transaction_type: ''
  };
  startDateInput.value = '';
  endDateInput.value = '';
  selectedExpenseIndex.value = null;
  selectedIncomeIndex.value = null;
  selectedChartCategoryRecordId.value = null;
};

const resetAllFilters = clearFilters;

// Multi-Select Helpers
const selectAllBuckets = () => {
  filters.value.bucket_ids = props.buckets.map(b => b.id);
};

const deselectAllBuckets = () => {
  filters.value.bucket_ids = [];
};

const toggleBucketFilter = (bId) => {
  const idx = filters.value.bucket_ids.indexOf(bId);
  if (idx > -1) {
    filters.value.bucket_ids.splice(idx, 1);
  } else {
    filters.value.bucket_ids.push(bId);
  }
};

const selectAllAccounts = () => {
  filters.value.account_ids = props.accounts.map(a => a.id);
};

const deselectAllAccounts = () => {
  filters.value.account_ids = [];
};

const toggleAccountFilter = (accId) => {
  const idx = filters.value.account_ids.indexOf(accId);
  if (idx > -1) {
    filters.value.account_ids.splice(idx, 1);
  } else {
    filters.value.account_ids.push(accId);
  }
};

const selectAllCategories = () => {
  filters.value.category_ids = props.categories.map(c => c.id);
};

const deselectAllCategories = () => {
  filters.value.category_ids = [];
};

const toggleCategoryFilter = (catId) => {
  const idx = filters.value.category_ids.indexOf(catId);
  if (idx > -1) {
    filters.value.category_ids.splice(idx, 1);
  } else {
    filters.value.category_ids.push(catId);
  }
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
  if (t.account_id === 'acc_unassigned_pool') return false;

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

  // 3. Bucket Filter (Multi-select)
  if (filters.value.bucket_ids.length > 0 && !filters.value.bucket_ids.includes(t.bucket_id)) {
    return false;
  }

  // 4. Account Filter (Multi-select)
  if (filters.value.account_ids.length > 0 && !filters.value.account_ids.includes(t.account_id)) {
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
      const catIcon = getCategoryIcon(t.category_id);
      const amt = Number(t.amount) || 0;
      if (!map[catName]) {
        map[catName] = { id: t.category_id, name: catName, color: catColor, icon: catIcon, total: 0 };
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
      const catIcon = getCategoryIcon(t.category_id);
      const amt = Number(t.amount) || 0;
      if (!map[catName]) {
        map[catName] = { id: t.category_id, name: catName, color: catColor, icon: catIcon, total: 0 };
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
  const outerR = 103;
  const innerR = 89;
  const hitOuterR = 118;
  const hitInnerR = 74;

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
  closeViewModal();
  emit('edit-transaction', tx);
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

// Computed O(1) Lookup Maps for High Performance
const categoryMap = computed(() => new Map(props.categories.map(c => [c.id, c])));
const accountMap = computed(() => new Map(props.accounts.map(a => [a.id, a])));
const bucketMap = computed(() => new Map(props.buckets.map(b => [b.id, b])));

// Helper Lookup Methods (O(1) Speed)
const getCategoryName = (id) => categoryMap.value.get(id)?.name || 'Uncategorized';
const getCategoryIcon = (id) => categoryMap.value.get(id)?.icon || 'label';
const getCategoryColor = (id) => categoryMap.value.get(id)?.color || '#64748b';
const getAccountName = (id) => accountMap.value.get(id)?.name || 'Unknown Account';
const getBucketName = (id) => (id ? bucketMap.value.get(id)?.name || 'General' : 'General');
const getBucketIcon = (id) => (id ? bucketMap.value.get(id)?.icon || 'savings' : 'savings');
const getBucketColor = (id) => (id ? bucketMap.value.get(id)?.color || '#D4BFFF' : '#D4BFFF');

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
  if (tx.transaction_type === 'income') return 'bg-[#B3F5E1]/20 text-[#B3F5E1] border border-[#B3F5E1]/30';
  if (tx.transaction_type === 'transfer') return 'bg-[#D4BFFF]/20 text-[#D4BFFF] border border-[#D4BFFF]/30';
  if (tx.transaction_type === 'adjustment') return 'bg-[#d2bbff]/20 text-[#d2bbff] border border-[#d2bbff]/30';
  return 'bg-[#FFD1B3]/20 text-[#FFD1B3] border border-[#FFD1B3]/30';
};

const transactionAmountClass = (tx) => {
  if (tx.transaction_type === 'income') return 'text-[#B3F5E1]';
  if (tx.transaction_type === 'transfer') return 'text-[#D4BFFF]';
  if (tx.transaction_type === 'adjustment') {
    if (tx.adjustment_direction === 'add') return 'text-[#B3F5E1]';
    if (tx.adjustment_direction === 'subtract') return 'text-[#FFD1B3]';
    return 'text-[#D4BFFF]';
  }
  return 'text-[#FFD1B3]';
};

const transactionSign = (tx) => {
  if (tx.transaction_type === 'income') return '+';
  if (tx.transaction_type === 'transfer') {
    if (tx.adjustment_direction === 'add') return '+';
    if (tx.adjustment_direction === 'subtract') return '-';
    return '⇄ ';
  }
  if (tx.transaction_type === 'adjustment') {
    if (tx.adjustment_direction === 'add') return '+';
    if (tx.adjustment_direction === 'subtract') return '-';
    return '±';
  }
  return '-';
};

const transactionLabel = (tx) => {
  if (tx.transaction_type === 'income') return 'Income';
  if (tx.transaction_type === 'transfer') return 'Transfer';
  if (tx.transaction_type === 'adjustment') return 'Adjustment';
  return 'Expense';
};
</script>

<style scoped>
.flip-list-move,
.flip-list-enter-active,
.flip-list-leave-active {
  transition: transform 0.22s var(--ease-out), opacity 0.22s var(--ease-out);
}

/* Modal and Dropdown Sheet Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.22s var(--ease-out), transform 0.22s var(--ease-out);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(6px);
}

/* Transaction Detail Modal Sheet Spring Animation */
.modal-sheet-enter-active,
.modal-sheet-leave-active {
  transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-sheet-enter-active .modal-sheet-card,
.modal-sheet-leave-active .modal-sheet-card {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}

.modal-sheet-enter-from,
.modal-sheet-leave-to {
  opacity: 0;
}
.modal-sheet-enter-from .modal-sheet-card,
.modal-sheet-leave-to .modal-sheet-card {
  opacity: 0;
  transform: translateY(20px) scale(0.96);
}

/* Full Month Slide Out & Slide In Animations */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}

/* Going Next: Old slide moves LEFT (-24px), new slide enters from RIGHT (24px) */
.slide-next-enter-from {
  transform: translateX(24px);
  opacity: 0;
}
.slide-next-leave-to {
  transform: translateX(-24px);
  opacity: 0;
}

/* Going Prev: Old slide moves RIGHT (24px), new slide enters from LEFT (-24px) */
.slide-prev-enter-from {
  transform: translateX(-24px);
  opacity: 0;
}
.slide-prev-leave-to {
  transform: translateX(24px);
  opacity: 0;
}
</style>
