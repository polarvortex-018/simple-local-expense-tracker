<template>
  <div class="space-y-6">
    
    <!-- MAIN "MORE" HUB GRID (Visible when no sheet/page is open) -->
    <div v-if="!activeSheet" class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center border-b border-[#1f202e] pb-4 animate-cascade-1">
        <div>
          <h2 class="text-xl font-bold text-[#f1f0f5] tracking-tight">More</h2>
          <p class="text-xs text-[#9e9cae] mt-0.5">Preferences, savings buckets, accounts, data backup, and app guide</p>
        </div>
      </div>

      <!-- 2-3 Column Grid of Feature Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 animate-cascade-2">
        
        <!-- 1. Quick Actions Tile -->
        <button 
          type="button"
          @click="activeSheet = 'quick_actions'"
          class="p-3.5 sm:p-4 bg-[#0f1019] hover:bg-[#141520] border border-[#1f202e] hover:border-[#D4BFFF]/40 rounded-2xl transition duration-200 cursor-pointer text-left flex flex-col justify-between space-y-3 group active:scale-[0.98] shadow-sm min-h-[110px]"
        >
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#D4BFFF]/10 border border-[#D4BFFF]/20 text-[#D4BFFF] flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-lg">bolt</span>
            </div>
            <span class="material-symbols-outlined text-xs text-[#9e9cae] group-hover:text-[#D4BFFF] transition">arrow_forward</span>
          </div>
          <div>
            <h3 class="text-xs sm:text-sm font-bold text-[#f1f0f5] group-hover:text-[#D4BFFF] transition leading-tight">Quick Actions</h3>
            <p class="text-[10px] text-[#9e9cae] mt-1 leading-tight">Transfers & salary splits</p>
          </div>
        </button>

        <!-- 2. Savings Buckets Tile -->
        <button 
          data-tour="buckets-tile"
          type="button"
          @click="activeSheet = 'buckets'"
          class="p-3.5 sm:p-4 bg-[#0f1019] hover:bg-[#141520] border border-[#1f202e] hover:border-[#D4BFFF]/40 rounded-2xl transition duration-200 cursor-pointer text-left flex flex-col justify-between space-y-3 group active:scale-[0.98] shadow-sm min-h-[110px]"
        >
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#D4BFFF]/10 border border-[#D4BFFF]/20 text-[#D4BFFF] flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-lg">savings</span>
            </div>
            <span class="material-symbols-outlined text-xs text-[#9e9cae] group-hover:text-[#D4BFFF] transition">arrow_forward</span>
          </div>
          <div>
            <h3 class="text-xs sm:text-sm font-bold text-[#f1f0f5] group-hover:text-[#D4BFFF] transition leading-tight">Savings Buckets</h3>
            <p class="text-[10px] text-[#9e9cae] mt-1 leading-tight">Goal buckets & allocations</p>
          </div>
        </button>

        <!-- 3. Manage Accounts Tile -->
        <button 
          type="button"
          @click="activeSheet = 'accounts'"
          class="p-3.5 sm:p-4 bg-[#0f1019] hover:bg-[#141520] border border-[#1f202e] hover:border-[#B3F5E1]/40 rounded-2xl transition duration-200 cursor-pointer text-left flex flex-col justify-between space-y-3 group active:scale-[0.98] shadow-sm min-h-[110px]"
        >
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#B3F5E1]/10 border border-[#B3F5E1]/20 text-[#B3F5E1] flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-lg">account_balance</span>
            </div>
            <span class="material-symbols-outlined text-xs text-[#9e9cae] group-hover:text-[#B3F5E1] transition">arrow_forward</span>
          </div>
          <div>
            <h3 class="text-xs sm:text-sm font-bold text-[#f1f0f5] group-hover:text-[#B3F5E1] transition leading-tight">Manage Accounts</h3>
            <p class="text-[10px] text-[#9e9cae] mt-1 leading-tight">Bank & wallet accounts</p>
          </div>
        </button>

        <!-- 4. Manage Categories Tile -->
        <button 
          data-tour="categories-tile"
          type="button"
          @click="activeSheet = 'categories'"
          class="p-3.5 sm:p-4 bg-[#0f1019] hover:bg-[#141520] border border-[#1f202e] hover:border-[#FFD1B3]/40 rounded-2xl transition duration-200 cursor-pointer text-left flex flex-col justify-between space-y-3 group active:scale-[0.98] shadow-sm min-h-[110px]"
        >
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FFD1B3]/10 border border-[#FFD1B3]/20 text-[#FFD1B3] flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-lg">category</span>
            </div>
            <span class="material-symbols-outlined text-xs text-[#9e9cae] group-hover:text-[#FFD1B3] transition">arrow_forward</span>
          </div>
          <div>
            <h3 class="text-xs sm:text-sm font-bold text-[#f1f0f5] group-hover:text-[#FFD1B3] transition leading-tight">Manage Categories</h3>
            <p class="text-[10px] text-[#9e9cae] mt-1 leading-tight">Categories & appearance</p>
          </div>
        </button>

        <!-- 5. Backup & Export Tile -->
        <button 
          data-tour="backup-[#D4BFFF]"
          data-tour-target="backup-tile"
          type="button"
          @click="activeSheet = 'backup'"
          class="p-3.5 sm:p-4 bg-[#0f1019] hover:bg-[#141520] border border-[#1f202e] hover:border-[#D4BFFF]/40 rounded-2xl transition duration-200 cursor-pointer text-left flex flex-col justify-between space-y-3 group active:scale-[0.98] shadow-sm min-h-[110px]"
        >
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#D4BFFF]/10 border border-[#D4BFFF]/20 text-[#D4BFFF] flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-lg">database</span>
            </div>
            <span class="material-symbols-outlined text-xs text-[#9e9cae] group-hover:text-[#D4BFFF] transition">arrow_forward</span>
          </div>
          <div>
            <h3 class="text-xs sm:text-sm font-bold text-[#f1f0f5] group-hover:text-[#D4BFFF] transition leading-tight">Backup & Export</h3>
            <p class="text-[10px] text-[#9e9cae] mt-1 leading-tight">Database backup & snapshots</p>
          </div>
        </button>

        <!-- 6. FAQ & About Tile -->
        <button 
          type="button"
          @click="activeSheet = 'faq'"
          class="p-3.5 sm:p-4 bg-[#0f1019] hover:bg-[#141520] border border-[#1f202e] hover:border-[#B3F5E1]/40 rounded-2xl transition duration-200 cursor-pointer text-left flex flex-col justify-between space-y-3 group active:scale-[0.98] shadow-sm min-h-[110px]"
        >
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#B3F5E1]/10 border border-[#B3F5E1]/20 text-[#B3F5E1] flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-lg">help_outline</span>
            </div>
            <span class="material-symbols-outlined text-xs text-[#9e9cae] group-hover:text-[#B3F5E1] transition">arrow_forward</span>
          </div>
          <div>
            <h3 class="text-xs sm:text-sm font-bold text-[#f1f0f5] group-hover:text-[#B3F5E1] transition leading-tight">FAQ & About</h3>
            <p class="text-[10px] text-[#9e9cae] mt-1 leading-tight">App guide & creator note</p>
          </div>
        </button>

        <!-- 7. Balance Adjustments Log Tile -->
        <button 
          type="button"
          @click="openAdjustmentAuditSheet"
          class="p-3.5 sm:p-4 bg-[#0f1019] hover:bg-[#141520] border border-[#1f202e] hover:border-[#D4BFFF]/40 rounded-2xl transition duration-200 cursor-pointer text-left flex flex-col justify-between space-y-3 group active:scale-[0.98] shadow-sm min-h-[110px]"
        >
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#D4BFFF]/10 border border-[#D4BFFF]/20 text-[#D4BFFF] flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-lg">history_edu</span>
            </div>
            <span class="material-symbols-outlined text-xs text-[#9e9cae] group-hover:text-[#D4BFFF] transition">arrow_forward</span>
          </div>
          <div>
            <h3 class="text-xs sm:text-sm font-bold text-[#f1f0f5] group-hover:text-[#D4BFFF] transition leading-tight">Balance Adjustments Log</h3>
            <p class="text-[10px] text-[#9e9cae] mt-1 leading-tight">Adjustment history & logs</p>
          </div>
        </button>

      </div>
    </div>

    <!-- ENTIRE FULL PAGE VIEW (Opened when activeSheet is selected) -->
    <Transition name="fade-slide">
      <div v-if="activeSheet" class="fixed inset-0 z-50 bg-[#0c0d14] flex flex-col w-full h-full overflow-hidden">
        
        <!-- Full Page Header Bar -->
        <div class="px-4 sm:px-6 pb-3.5 border-b border-[#1f202e] flex items-center justify-between bg-[#0c0d14]/95 backdrop-blur-md shrink-0 safe-area-modal-pt">
          <div class="flex items-center gap-3">
            <button 
              @click="activeSheet = null"
              class="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#141520] hover:bg-[#1f202e] border border-[#1f202e] rounded-xl text-xs font-bold text-[#D4BFFF] transition cursor-pointer active:scale-95"
            >
              <span class="material-symbols-outlined text-base">arrow_back</span>
              <span>Back to More</span>
            </button>
            <div class="h-4 w-px bg-[#1f202e] mx-1"></div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-lg text-[#D4BFFF] leading-none">
                {{ getSheetIcon(activeSheet) }}
              </span>
              <h3 class="text-base font-bold text-[#f1f0f5] tracking-tight">
                {{ getSheetTitle(activeSheet) }}
              </h3>
            </div>
          </div>

          <button 
            @click="activeSheet = null"
            class="w-8 h-8 rounded-full bg-[#141520] hover:bg-[#1f202e] text-[#9e9cae] hover:text-[#f1f0f5] flex items-center justify-center transition cursor-pointer"
            title="Close Page"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Full Page Content Body Container -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-6 pb-32 max-w-4xl mx-auto w-full space-y-6">
          
          <!-- 1. QUICK ACTIONS PAGE -->
          <div v-if="activeSheet === 'quick_actions'" class="space-y-6">
            <div>
              <h3 class="text-lg font-bold text-[#f1f0f5] tracking-tight">Quick Actions</h3>
              <p class="text-xs text-[#9e9cae] mt-0.5">Rapid balance operations and allocation presets</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <!-- Bucket Transfer Button -->
              <button
                @click="showTransferModal = true"
                class="flex items-center justify-between p-4 bg-[#0f1019] hover:bg-[#141520] border border-[#1f202e] hover:border-[#D4BFFF]/40 rounded-2xl transition cursor-pointer text-left group active:scale-[0.98]"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-xl bg-[#D4BFFF]/10 border border-[#D4BFFF]/20 text-[#D4BFFF] flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-xl">swap_horiz</span>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-[#f1f0f5]">Bucket Transfer</p>
                    <p class="text-[10px] text-[#9e9cae] mt-0.5 truncate">Move allocation between buckets</p>
                  </div>
                </div>
                <span class="material-symbols-outlined text-sm text-[#9e9cae] group-hover:text-[#D4BFFF] transition">chevron_right</span>
              </button>

              <!-- Account Transfer Button -->
              <button
                @click="showAccountTransferModal = true"
                class="flex items-center justify-between p-4 bg-[#0f1019] hover:bg-[#141520] border border-[#1f202e] hover:border-[#D4BFFF]/40 rounded-2xl transition cursor-pointer text-left group active:scale-[0.98]"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-xl bg-[#D4BFFF]/10 border border-[#D4BFFF]/20 text-[#D4BFFF] flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-xl">sync_alt</span>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-[#f1f0f5]">Account Transfer</p>
                    <p class="text-[10px] text-[#9e9cae] mt-0.5 truncate">Transfer funds between bank accounts</p>
                  </div>
                </div>
                <span class="material-symbols-outlined text-sm text-[#9e9cae] group-hover:text-[#D4BFFF] transition">chevron_right</span>
              </button>

              <!-- Salary Allocation Preset Button -->
              <button
                @click="showPresetsModal = true"
                class="flex items-center justify-between p-4 bg-[#0f1019] hover:bg-[#141520] border border-[#1f202e] hover:border-[#D4BFFF]/40 rounded-2xl transition cursor-pointer text-left group active:scale-[0.98]"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-xl bg-[#D4BFFF]/10 border border-[#D4BFFF]/20 text-[#D4BFFF] flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-xl">auto_awesome</span>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-[#f1f0f5]">Salary Allocation</p>
                    <p class="text-[10px] text-[#9e9cae] mt-0.5 truncate">Auto-split deposits into buckets</p>
                  </div>
                </div>
                <span class="material-symbols-outlined text-sm text-[#9e9cae] group-hover:text-[#D4BFFF] transition">chevron_right</span>
              </button>
            </div>
          </div>

          <!-- 2. SAVINGS BUCKETS PAGE -->
          <div v-if="activeSheet === 'buckets'" class="space-y-6">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-lg font-bold text-[#f1f0f5] tracking-tight">Savings Buckets</h3>
                <p class="text-xs text-[#9e9cae]">Allocate purposes for your money</p>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  @click="showArchivedBuckets = !showArchivedBuckets"
                  class="text-[11px] font-bold text-[#9e9cae] hover:text-[#D4BFFF] hover:underline cursor-pointer"
                >
                  {{ showArchivedBuckets ? 'Hide Archived' : 'Show Archived' }}
                </button>
                <button 
                  @click="openCreateBucketModal"
                  class="px-3 py-1.5 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span>+ Create Bucket</span>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl border border-[#1f202e] bg-[#0f1019] p-3">
                <p class="text-[9px] font-bold uppercase tracking-wider text-[#D4BFFF]">Total allocated</p>
                <p class="mt-0.5 text-sm font-bold text-[#f1f0f5] tabular-nums">₹{{ formatAmount(totalAllocated) }}</p>
              </div>
              <div class="rounded-xl border border-[#1f202e] bg-[#0f1019] p-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <p class="text-[9px] font-bold uppercase tracking-wider text-[#FFD1B3]">Unallocated Funds Pool</p>
                  <p class="mt-0.5 text-sm font-bold text-[#FFD1B3] tabular-nums">₹{{ formatAmount(unassignedAmount) }}</p>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    @click="openAllocateModal()"
                    class="px-2.5 py-1 bg-[#FFD1B3]/20 hover:bg-[#FFD1B3]/30 border border-[#FFD1B3]/40 text-[#FFD1B3] text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Allocate
                  </button>
                  <button
                    type="button"
                    @click="showPresetsModal = true"
                    class="px-2.5 py-1 bg-[#D4BFFF]/20 hover:bg-[#D4BFFF]/30 border border-[#D4BFFF]/40 text-[#D4BFFF] text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                  >
                    <span class="material-symbols-outlined text-xs">payments</span>
                    <span>Salary Allocation</span>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="displayedBuckets.length > 0" class="divide-y divide-[#1f202e] border-y border-[#1f202e]">
              <div 
                v-for="(bucket, idx) in displayedBuckets" 
                :key="bucket.id"
                class="py-3 px-1 hover:bg-[#141520] transition duration-150 flex items-center justify-between"
              >
                <div class="flex items-center gap-2.5 min-w-0 flex-grow">
                  <div class="flex flex-col gap-0.5 shrink-0 mr-0.5">
                    <button 
                      type="button"
                      @click="moveBucketPriority(idx, -1)"
                      :disabled="idx === 0"
                      class="text-[10px] leading-none p-0.5 text-[#9e9cae] hover:text-[#D4BFFF] disabled:opacity-20 cursor-pointer"
                      title="Move Priority Up"
                    >▲</button>
                    <button 
                      type="button"
                      @click="moveBucketPriority(idx, 1)"
                      :disabled="idx === displayedBuckets.length - 1"
                      class="text-[10px] leading-none p-0.5 text-[#9e9cae] hover:text-[#D4BFFF] disabled:opacity-20 cursor-pointer"
                      title="Move Priority Down"
                    >▼</button>
                  </div>

                  <div class="w-8 h-8 rounded-lg bg-[#141520] border border-[#1f202e] flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-base leading-none" :style="{ color: bucket.color || '#D4BFFF' }">{{ resolveIcon(bucket.icon, 'savings') }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                      <p class="text-xs font-bold text-[#f1f0f5] truncate">{{ bucket.name }}</p>
                      <span v-if="bucket.is_archived" class="px-1.5 py-0.2 text-[9px] font-semibold rounded bg-amber-950/60 text-amber-400 border border-amber-800/40 shrink-0">Archived</span>
                    </div>
                    <p class="text-[10px] text-[#9e9cae] font-medium mt-0.5">
                      Allocated: <span class="text-[#D4BFFF] font-bold">₹{{ formatAmount(bucket.allocated_balance) }}</span>
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    v-if="unassignedAmount > 0 && !bucket.is_archived"
                    @click="allocateToBucket(bucket)"
                    class="px-2 py-1.5 rounded-lg border border-amber-800/50 bg-amber-950/40 text-[9px] font-bold text-amber-300 cursor-pointer"
                    title="Deposit funds into bucket"
                  >Allocate</button>
                  <button 
                    @click="openEditBucketModal(bucket)"
                    class="text-[#9e9cae] hover:text-[#D4BFFF] hover:bg-[#141520] p-1.5 rounded-lg transition cursor-pointer text-xs"
                    title="Edit Bucket"
                  >
                    <span class="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button 
                    @click="confirmDeleteBucket(bucket)"
                    class="text-[#9e9cae] hover:text-rose-400 hover:bg-rose-950/20 p-1.5 rounded-lg transition cursor-pointer text-xs"
                    title="Delete / Archive Bucket"
                  >
                    <span class="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 border-y border-[#1f202e] text-xs text-[#9e9cae]">
              No savings buckets found.
            </div>
          </div>

          <!-- 3. MANAGE ACCOUNTS PAGE -->
          <div v-if="activeSheet === 'accounts'" class="space-y-6">
            <div>
              <h3 class="text-lg font-bold text-[#f1f0f5] tracking-tight">Manage Accounts</h3>
              <p class="text-xs text-[#9e9cae]">Create accounts (where money is stored)</p>
            </div>

            <!-- Add Account Form -->
            <form @submit.prevent="submitAccount" class="p-4 bg-[#0f1019] border border-[#1f202e] rounded-xl space-y-3.5">
              <p class="text-xs font-bold text-[#f1f0f5] uppercase tracking-wider">Add New Account</p>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input 
                  v-model="newAccount.name"
                  type="text"
                  placeholder="Account Name (e.g. SBI)"
                  required
                  class="w-full px-3.5 py-2 bg-[#141520] border border-[#1f202e] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs placeholder-[#9e9cae] focus:outline-none transition"
                />
                <select 
                  v-model="newAccount.type"
                  class="w-full px-3.5 py-2 bg-[#141520] border border-[#1f202e] hover:bg-[#191924] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition cursor-pointer"
                >
                  <option value="Checking" class="bg-[#0c0d14]">Checking</option>
                  <option value="Savings" class="bg-[#0c0d14]">Savings</option>
                  <option value="Credit Card" class="bg-[#0c0d14]">Credit Card</option>
                  <option value="Cash" class="bg-[#0c0d14]">Cash</option>
                  <option value="Wallet" class="bg-[#0c0d14]">Wallet</option>
                </select>
              </div>
              <button 
                type="submit"
                :disabled="submittingAccount"
                class="w-full py-2.5 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50 min-h-[38px]"
              >
                {{ submittingAccount ? 'Creating...' : '+ Create Account' }}
              </button>
            </form>

            <!-- Account List -->
            <div>
              <div v-if="userAccounts.length > 0" class="divide-y divide-[#1f202e] border-y border-[#1f202e]">
                <div 
                  v-for="account in userAccounts" 
                  :key="account.id"
                  class="py-3 px-1 hover:bg-[#141520] transition duration-150"
                >
                  <!-- Editing Mode -->
                  <div v-if="editingAccountId === account.id" class="space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input 
                        v-model="editAccountName"
                        type="text"
                        required
                        class="w-full px-3 py-1.5 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-lg text-[#f1f0f5] text-xs focus:outline-none transition"
                      />
                      <select 
                        v-model="editAccountType"
                        class="w-full px-2.5 py-1.5 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-lg text-[#f1f0f5] text-xs focus:outline-none transition cursor-pointer"
                      >
                        <option value="Checking" class="bg-[#0c0d14]">Checking</option>
                        <option value="Savings" class="bg-[#0c0d14]">Savings</option>
                        <option value="Credit Card" class="bg-[#0c0d14]">Credit Card</option>
                        <option value="Cash" class="bg-[#0c0d14]">Cash</option>
                        <option value="Wallet" class="bg-[#0c0d14]">Wallet</option>
                      </select>
                    </div>
                    <div class="flex justify-end gap-2">
                      <button 
                        type="button"
                        @click="cancelEditAccount"
                        class="px-2.5 py-1 text-[10px] font-semibold text-[#9e9cae] hover:text-[#f1f0f5] transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        @click="saveAccountEdit(account)"
                        class="px-2.5 py-1 bg-[#D4BFFF] text-[#0f0f15] font-bold text-[10px] rounded-lg transition cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <!-- Normal Mode -->
                  <div v-else class="flex items-center justify-between">
                    <div>
                      <p class="text-xs font-bold text-[#f1f0f5]">{{ account.name }}</p>
                      <p class="text-[10px] text-[#9e9cae] mt-0.5">
                        <span class="px-1.5 py-0.5 rounded bg-[#0f1019] border border-[#1f202e] text-[#9e9cae]">{{ account.type }}</span>
                        <span class="ml-2 font-medium text-[#f1f0f5]">Balance: <span class="font-bold text-[#B3F5E1]">₹{{ formatAmount(account.balance) }}</span></span>
                      </p>
                    </div>
                    <div class="flex gap-1">
                      <button 
                        @click="startEditAccount(account)"
                        class="text-[#9e9cae] hover:text-[#D4BFFF] hover:bg-[#141520] p-1.5 rounded-lg transition cursor-pointer"
                        title="Edit Account"
                      >
                        <span class="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button 
                        @click="confirmDeleteAccount(account)"
                        class="text-[#9e9cae] hover:text-rose-400 hover:bg-rose-950/20 p-1.5 rounded-lg transition cursor-pointer"
                        title="Delete Account"
                      >
                        <span class="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-8 border-y border-[#1f202e] text-xs text-[#9e9cae]">
                No accounts configured.
              </div>
            </div>
          </div>

          <!-- 4. MANAGE CATEGORIES PAGE -->
          <div v-if="activeSheet === 'categories'" class="space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-bold text-[#f1f0f5] tracking-tight">Manage Categories</h3>
                <p class="text-xs text-[#9e9cae]">Create and organize spending categories</p>
              </div>
              <button 
                @click="openCreateCategoryModal"
                class="px-3 py-1.5 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>+ Create Category</span>
              </button>
            </div>

            <div v-if="categories.length > 0" class="divide-y divide-[#1f202e] border-y border-[#1f202e]">
              <div 
                v-for="(category, idx) in categories" 
                :key="category.id"
                class="py-2.5 px-1 flex items-center justify-between gap-2 hover:bg-[#141520] transition duration-150"
              >
                <div class="flex items-center gap-2.5 min-w-0 flex-grow">
                  <div class="flex flex-col gap-0.5 shrink-0 mr-0.5">
                    <button 
                      type="button"
                      @click="moveCategoryPriority(idx, -1)"
                      :disabled="idx === 0"
                      class="text-[9px] p-0.5 text-[#9e9cae] hover:text-[#D4BFFF] disabled:opacity-20 cursor-pointer"
                      title="Move Priority Up"
                    >▲</button>
                    <button 
                      type="button"
                      @click="moveCategoryPriority(idx, 1)"
                      :disabled="idx === categories.length - 1"
                      class="text-[9px] p-0.5 text-[#9e9cae] hover:text-[#D4BFFF] disabled:opacity-20 cursor-pointer"
                      title="Move Priority Down"
                    >▼</button>
                  </div>
                  <div class="w-7 h-7 rounded-lg bg-[#141520] border border-[#1f202e] flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-base leading-none" :style="{ color: category.color || '#D4BFFF' }">{{ resolveIcon(category.icon, 'category') }}</span>
                  </div>
                  <p class="text-xs font-bold text-[#f1f0f5] truncate" :title="category.name">{{ category.name }}</p>
                  <span v-if="category.is_quick_select" class="text-[9px] font-bold text-[#D4BFFF] bg-[#D4BFFF]/10 px-1.5 py-0.2 rounded border border-[#D4BFFF]/20 shrink-0">Pinned</span>
                </div>

                <div class="flex items-center gap-1 shrink-0">
                  <button 
                    @click="openEditCategoryModal(category)"
                    class="text-[#9e9cae] hover:text-[#D4BFFF] hover:bg-[#141520] p-1.5 rounded-lg transition cursor-pointer text-xs"
                    title="Edit Category"
                  >
                    <span class="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button 
                    @click="confirmDeleteCategory(category)"
                    class="text-[#9e9cae] hover:text-rose-400 hover:bg-rose-950/20 p-1.5 rounded-lg transition cursor-pointer text-xs"
                    title="Delete Category"
                  >
                    <span class="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-12 border border-dashed border-[#29293a] rounded-xl text-xs text-[#6b6a7d]">
              No categories configured.
            </div>
          </div>

          <!-- 5. BACKUP & EXPORT PAGE (FULL FLUID SCROLLING WITHOUT CUTOFF) -->
          <div v-if="activeSheet === 'backup'" class="space-y-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#1f202e] pb-4">
              <div>
                <h3 class="text-base font-bold text-[#f1f0f5] flex items-center gap-2">
                  <span class="material-symbols-outlined text-base text-[#D4BFFF]">database</span>
                  <span>Data Backup & Export Controls</span>
                </h3>
                <p class="text-xs text-[#9e9cae] mt-0.5">Export active database file, create local snapshots, or restore backups.</p>
              </div>
              <div class="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto shrink-0">
                <button 
                  type="button"
                  @click="handleExportActiveDatabase"
                  class="px-3.5 py-2 bg-[#B3F5E1] hover:bg-[#92edd0] text-[#0f0f15] font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm min-h-[36px]"
                >
                  <span class="material-symbols-outlined text-sm">download</span>
                  <span>Export Database</span>
                </button>
                <label class="px-3.5 py-2 bg-[#0f1019] hover:bg-[#141520] text-[#f1f0f5] border border-[#1f202e] hover:border-[#D4BFFF]/40 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[36px]">
                  <span class="material-symbols-outlined text-sm">upload</span>
                  <span>Import Backup</span>
                  <input type="file" accept=".db,.sqlite,.cbbak,*/*" class="hidden" @change="handleImportBackupFile" />
                </label>
                <button 
                  @click="handleCreateSnapshot"
                  :disabled="creatingBackup"
                  class="px-3.5 py-2 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm min-h-[36px]"
                >
                  <span class="material-symbols-outlined text-sm">photo_camera</span>
                  <span>{{ creatingBackup ? 'Creating...' : 'Create Snapshot' }}</span>
                </button>
              </div>
            </div>

            <!-- Local Snapshots List (Full length scroll without inner height cutoff) -->
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <p class="text-xs font-semibold text-[#9e9cae] uppercase tracking-wider">Local Snapshots (<code class="text-[#D4BFFF] font-mono">backups/</code>)</p>
                <button @click="loadBackupsList" class="text-xs text-[#D4BFFF] hover:underline cursor-pointer">Refresh List</button>
              </div>

              <div v-if="backupsList.length > 0" class="divide-y divide-[#1f202e] border-y border-[#1f202e]">
                <div 
                  v-for="b in backupsList" 
                  :key="b.filename"
                  class="py-3.5 px-1 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-[#141520] transition gap-3"
                >
                  <div class="flex items-center gap-2.5 min-w-0 flex-grow">
                    <span class="material-symbols-outlined text-base text-[#D4BFFF] shrink-0">inventory_2</span>
                    <div class="min-w-0 flex-grow">
                      <p class="text-xs font-bold text-[#f1f0f5] font-mono break-all sm:truncate" :title="b.filename">{{ b.filename }}</p>
                      <p class="text-[10px] text-[#9e9cae] mt-0.5">{{ formatSize(b.size_bytes) }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end w-full sm:w-auto">
                    <button
                      @click="handleDownloadBackup(b.filename)"
                      class="px-2.5 py-1.5 bg-[#0f1019] hover:bg-[#141520] text-[#B3F5E1] border border-[#1f202e] hover:border-[#B3F5E1]/40 font-bold text-[10px] rounded-lg transition cursor-pointer flex items-center gap-1 min-h-[28px]"
                      title="Download backup file"
                    >
                      <span>Save</span>
                    </button>
                    <button 
                      @click="handleShareBackup(b.filename)"
                      class="px-2.5 py-1.5 bg-[#0f1019] hover:bg-[#141520] text-[#D4BFFF] border border-[#1f202e] hover:border-[#D4BFFF]/40 font-bold text-[10px] rounded-lg transition cursor-pointer flex items-center gap-1 min-h-[28px]"
                      title="Share file"
                    >
                      <span>Share</span>
                    </button>
                    <button 
                      @click="handleRestoreBackup(b.filename)"
                      class="px-3 py-1.5 bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800/40 font-bold text-[10px] rounded-lg transition cursor-pointer min-h-[28px]"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-6 border-y border-[#1f202e] text-xs text-[#9e9cae]">
                No snapshot backups saved in <code class="text-[#9e9cae] font-mono">backups/</code> folder yet.
              </div>
            </div>
          </div>

          <!-- 6. FAQ & ABOUT PAGE (Sajid's Exact Content) -->
          <div v-if="activeSheet === 'faq'" class="space-y-6">
            <!-- Take Tour Again Banner -->
            <div class="p-4 bg-[#0f1019] border border-[#D4BFFF]/30 rounded-2xl flex items-center justify-between shadow-lg">
              <div>
                <h4 class="text-xs font-bold text-[#f1f0f5]">Interactive App Tour</h4>
                <p class="text-[10px] text-[#9e9cae] mt-0.5">Re-run the Cash Buddy guided tutorial anytime</p>
              </div>
              <button 
                @click="emit('open-tutorial')" 
                type="button"
                class="px-3.5 py-2 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs rounded-xl transition cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-sm"
              >
                <span class="material-symbols-outlined text-base">auto_stories</span>
                <span>Take Tour Again</span>
              </button>
            </div>

            <!-- Frequently Asked Questions Card -->
            <div class="bg-[#14141d] border border-[#29293a] rounded-2xl p-6 shadow-xl space-y-4">
              <div class="border-b border-[#29293a] pb-3">
                <h3 class="text-base font-bold text-[#f1f0f5] flex items-center gap-2">
                  <span>❓</span> Frequently Asked Questions & App Guide
                </h3>
                <p class="text-xs text-[#9e9cae] mt-0.5">Quick guide on how Cash Buddy works and how to organize your finances.</p>
              </div>

              <div class="space-y-3">
                <!-- Q1: Buckets -->
                <details class="group bg-[#0f0f15]/40 border border-[#29293a]/80 rounded-xl overflow-hidden transition">
                  <summary class="p-3.5 text-xs font-bold text-[#dae2fd] cursor-pointer flex items-center justify-between hover:bg-[#0f0f15]/80">
                    <span>🪣 What are Savings Buckets & why create them?</span>
                    <span class="text-[#6b6a7d] group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div class="px-3.5 pb-3.5 text-xs text-[#ccc3d8] space-y-2 border-t border-[#29293a]/40 pt-2.5">
                    <p><strong>Buckets represent the PURPOSE of your money (why it exists).</strong></p>
                    <p class="text-[#9e9cae]">Instead of just seeing a lump sum in your bank account, Savings Buckets allow you to allocate funds for specific goals or expenses—such as an <em>Emergency Fund</em>, <em>Japan Trip</em>, <em>Rent</em>, or <em>Monthly Budget</em>.</p>
                  </div>
                </details>

                <!-- Q2: Accounts -->
                <details class="group bg-[#0f0f15]/40 border border-[#29293a]/80 rounded-xl overflow-hidden transition">
                  <summary class="p-3.5 text-xs font-bold text-[#dae2fd] cursor-pointer flex items-center justify-between hover:bg-[#0f0f15]/80">
                    <span>🏦 What are Accounts & what do they mean?</span>
                    <span class="text-[#6b6a7d] group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div class="px-3.5 pb-3.5 text-xs text-[#ccc3d8] space-y-2 border-t border-[#29293a]/40 pt-2.5">
                    <p><strong>Accounts represent the PHYSICAL STORAGE LOCATION of your money (where it lives).</strong></p>
                    <p class="text-[#9e9cae]">Examples include your <em>Checking Account</em>, <em>Savings Account</em>, <em>Physical Cash</em>, or <em>Digital Wallet</em>.</p>
                  </div>
                </details>

                <!-- Q3: Adding Transactions -->
                <details class="group bg-[#0f0f15]/40 border border-[#29293a]/80 rounded-xl overflow-hidden transition">
                  <summary class="p-3.5 text-xs font-bold text-[#dae2fd] cursor-pointer flex items-center justify-between hover:bg-[#0f0f15]/80">
                    <span>➕ How do I add a transaction and link Buckets & Accounts?</span>
                    <span class="text-[#6b6a7d] group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div class="px-3.5 pb-3.5 text-xs text-[#ccc3d8] space-y-2 border-t border-[#29293a]/40 pt-2.5">
                    <p>Tap the <strong>+ Add</strong> button anywhere in the app. You'll choose:</p>
                    <ul class="list-disc pl-4 space-y-1 text-[#9e9cae]">
                      <li><strong>Account</strong>: The bank account or cash wallet that paid or received the money.</li>
                      <li><strong>Savings Bucket</strong>: The purpose allocation that was spent from or added to.</li>
                      <li><strong>Category</strong>: The category (Food, Utilities, Shopping) for spending charts.</li>
                    </ul>
                  </div>
                </details>

                <!-- Q4: Filtering -->
                <details class="group bg-[#0f0f15]/40 border border-[#29293a]/80 rounded-xl overflow-hidden transition">
                  <summary class="p-3.5 text-xs font-bold text-[#dae2fd] cursor-pointer flex items-center justify-between hover:bg-[#0f0f15]/80">
                    <span>🔍 How does filtering work across the app?</span>
                    <span class="text-[#6b6a7d] group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div class="px-3.5 pb-3.5 text-xs text-[#ccc3d8] space-y-2 border-t border-[#29293a]/40 pt-2.5">
                    <p class="text-[#9e9cae]">In the <strong>History</strong> tab, you can filter by Date Range (This Month, Last Month, Custom), Transaction Type (Income/Expense), Account, Bucket, or Categories. The spending breakdown pie charts automatically update to reflect your active filter selection!</p>
                  </div>
                </details>

                <!-- Q5: Export & Backup -->
                <details class="group bg-[#0f0f15]/40 border border-[#29293a]/80 rounded-xl overflow-hidden transition">
                  <summary class="p-3.5 text-xs font-bold text-[#dae2fd] cursor-pointer flex items-center justify-between hover:bg-[#0f0f15]/80">
                    <span>💾 How do I backup or export my database?</span>
                    <span class="text-[#6b6a7d] group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div class="px-3.5 pb-3.5 text-xs text-[#ccc3d8] space-y-2 border-t border-[#29293a]/40 pt-2.5">
                    <p class="text-[#9e9cae]">Scroll up to <strong>Data Backup & Export Controls</strong> in Settings. Tap <strong>Export Active Database</strong> to download your standard <code class="text-[#D4BFFF] font-mono">.db</code> SQLite file directly to your phone's Files app, or tap <strong>Create Local Snapshot</strong> to save a local restore point anytime.</p>
                  </div>
                </details>
              </div>
            </div>

            <!-- ABOUT CASH BUDDY (Sajid's Creator Note & Guarantee) -->
            <div class="bg-gradient-to-br from-[#1a1030]/50 via-[#14141d] to-[#14141d] border border-[#D4BFFF]/15 rounded-2xl p-6 shadow-2xl space-y-5">
              <div class="flex items-center gap-3 border-b border-[#29293a]/80 pb-4">
                <img src="/cashbuddy-logo.svg?v=3" alt="Cash Buddy Logo" class="w-11 h-11 object-contain" />
                <div>
                  <h3 class="text-base font-bold text-[#f1f0f5]">About Cash Buddy</h3>
                  <p class="text-xs text-[#D4BFFF] font-medium">Your Personal Expense Tracker</p>
                </div>
              </div>

              <!-- Ideation & Creator Note -->
              <div class="space-y-3.5 text-xs text-[#ccc3d8] leading-relaxed">
                <div class="p-3.5 bg-[#1a1030]/50 border border-[#D4BFFF]/20 rounded-xl text-[#D4BFFF] font-medium flex items-center gap-2">
                  <span>✨</span>
                  <span>This whole app was built and ideated by <strong>Sajid</strong>.</span>
                </div>

                <p class="text-[#ccc3d8]">
                  I have been tracking my finances via a notepad all this time. It was just for my own needs so I would know where my money is going, but I thought I needed an app that would make adding transactions easier.
                </p>
                <p class="text-[#ccc3d8]">
                  The first thing that made me think of this was how I spent so much time at the end of months manually tallying and summing everything; it took way too long and quite frankly I would have made many mistakes.
                </p>
                <p class="text-[#ccc3d8]">
                  This app has been on my mind for the past 4-ish years, and I’ve been making versions of it for a very long time. But this is the first time that I’ve brought it to a phone. I am still actively working on making it better.
                </p>

              <!-- On-Device Local Data Storage Guarantee -->
                <div class="p-4 bg-[#0f0f15]/60 border border-[#29293a] rounded-xl space-y-2 text-[#9e9cae]">
                  <p class="font-bold text-[#dae2fd] uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <span>🔒</span> 100% Local On-Phone Storage Guarantee
                  </p>
                  <p class="text-[#ccc3d8] text-[11px] leading-normal">
                    Cash Buddy stores all your financial data <strong>completely locally on your own phone</strong>. Every transaction, savings bucket, and custom database vault is saved directly inside your device's local internal storage memory (WebAssembly SQLite + OPFS).
                  </p>
                  <p class="text-[#9e9cae] text-[11px] leading-normal">
                    No user accounts, no external servers, no cloud sync, and zero tracking—your financial data never leaves your device.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- 7. BALANCE ADJUSTMENTS & AUDIT LOG PAGE -->
          <div v-if="activeSheet === 'adjustment_audit'" class="space-y-6">
            <div>
              <h3 class="text-lg font-bold text-[#f1f0f5] tracking-tight">Balance Adjustments & Audit Log</h3>
              <p class="text-xs text-[#9e9cae]">Complete audit trail of account balance adjustments and ledger records.</p>
            </div>

            <div v-if="unassignedAuditLogs.length > 0" class="border-y border-[#1f202e] divide-y divide-[#1f202e]">
              <div 
                v-for="log in unassignedAuditLogs" 
                :key="log.id"
                class="py-3 px-1.5 hover:bg-[#141520] transition flex items-center justify-between gap-3 text-xs"
              >
                <div class="min-w-0 flex-1">
                  <p class="font-bold text-[#f1f0f5] truncate">{{ log.description || 'Account Adjustment' }}</p>
                  <p class="text-[10px] text-[#9e9cae] mt-0.5">
                    {{ log.date }} • Account: {{ log.account_name || 'General' }} • Bucket: {{ log.bucket_name || 'General' }}
                  </p>
                </div>
                <span 
                  class="font-bold tabular-nums text-xs shrink-0"
                  :class="log.adjustment_direction === 'subtract' ? 'text-[#FFD1B3]' : 'text-[#B3F5E1]'"
                >
                  {{ log.adjustment_direction === 'subtract' ? '-' : '+' }}₹{{ formatAmount(log.amount) }}
                </span>
              </div>
            </div>
            <div v-else class="text-center py-8 border-y border-[#1f202e] text-xs text-[#9e9cae]">
              No balance adjustment logs recorded yet.
            </div>
          </div>

        </div>
      </div>
    </Transition>

    <!-- Allocate from Unallocated Funds Modal -->
    <Transition name="modal">
      <div v-if="showAllocateModal" class="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 pt-[max(1.5rem,env(safe-area-inset-top))] sm:p-4 bg-[#0f0f15]/80 backdrop-blur-sm overflow-y-auto" @click.self="showAllocateModal = false">
        <div class="bg-[#14141d] border border-[#29293a] rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[88vh] my-auto">
          <!-- Header -->
          <div class="flex justify-between items-center border-b border-[#29293a] px-5 py-4 shrink-0">
            <div>
              <h3 class="text-base font-bold text-[#f1f0f5]">Allocate Unallocated Funds</h3>
              <p class="text-[10px] text-[#FFD1B3] mt-0.5 font-bold">Available Pool: ₹{{ formatAmount(unassignedAmount) }}</p>
            </div>
            <button @click="showAllocateModal = false" class="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 text-[#9e9cae] hover:text-[#f1f0f5] text-lg cursor-pointer">✕</button>
          </div>

          <form @submit.prevent="submitAllocateFromUnallocated" class="flex flex-col flex-1 min-h-0">
            <div class="overflow-y-auto p-5 space-y-4 flex-1 pb-14 sm:pb-5">
              <div class="p-3 bg-[#FFD1B3]/10 border border-[#FFD1B3]/20 rounded-xl text-xs text-[#FFD1B3]">
                <p>Reallocating from <strong>Unallocated Funds</strong> creates a real transaction for the chosen target bucket & category, so it instantly reflects in your pie charts & analytics!</p>
              </div>

              <!-- Target Bucket Selection -->
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-[#ccc3d8]">To Bucket *</label>
                <BucketGrid :buckets="activeBuckets" v-model="allocateForm.bucket_id" :show-unassigned="false" />
              </div>

              <!-- Category Selection -->
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-[#ccc3d8]">Category *</label>
                <CategoryPicker :categories="categories" v-model="allocateForm.category_id" title="Select Target Category" placeholder="Choose Category" />
              </div>

              <!-- Amount Input -->
              <div>
                <label class="block text-xs font-semibold text-[#ccc3d8] mb-1">Amount to Allocate (₹) *</label>
                <input 
                  v-model="allocateForm.amount"
                  type="text"
                  inputmode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  autocomplete="off"
                  placeholder="0.00"
                  required
                  class="w-full px-3.5 py-2.5 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition"
                />
              </div>

              <!-- Description -->
              <div>
                <label class="block text-xs font-semibold text-[#ccc3d8] mb-1">Description (Optional)</label>
                <input 
                  v-model="allocateForm.description"
                  type="text"
                  placeholder="e.g. Allocation from pool to Vacation"
                  class="w-full px-3.5 py-2.5 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition"
                />
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="border-t border-[#29293a] p-4 bg-[#14141d] shrink-0 flex gap-3">
              <button 
                type="button" 
                @click="showAllocateModal = false"
                class="flex-1 py-2.5 bg-[#1f1f2e] hover:bg-[#29293a] text-[#f1f0f5] text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                :disabled="submittingAllocate"
                class="flex-1 py-2.5 bg-[#FFD1B3] hover:bg-[#ffbe94] text-[#0f0f15] text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {{ submittingAllocate ? 'Allocating...' : 'Allocate Funds' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Sub-Modals (Bucket Transfer, Account Transfer, Presets, Category Form, Bucket Form) -->
    <!-- Bucket Transfer Modal -->
    <Transition name="modal">
      <div v-if="showTransferModal" class="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 pt-[max(1.5rem,env(safe-area-inset-top))] sm:p-4 bg-[#0f0f15]/80 backdrop-blur-sm overflow-y-auto" @click.self="showTransferModal = false">
        <div class="bg-[#14141d] border border-[#29293a] rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[88vh] my-auto">
          <!-- Header -->
          <div class="flex justify-between items-center border-b border-[#29293a] px-5 py-4 shrink-0">
            <h3 class="text-base font-bold text-[#f1f0f5]">Transfer Allocation</h3>
            <button @click="showTransferModal = false" class="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 text-[#9e9cae] hover:text-[#f1f0f5] text-lg cursor-pointer">✕</button>
          </div>

          <form @submit.prevent="submitBucketTransfer" class="flex flex-col flex-1 min-h-0">
            <div class="overflow-y-auto p-5 space-y-4 flex-1 pb-14 sm:pb-5">
              <div class="p-3 bg-[#1a1030]/30 border border-[#D4BFFF]/15 rounded-xl text-xs text-[#ccc3d8]">
                <p>This moves allocated funds from one bucket to another. Your physical <strong>bank account balances remain 100% unchanged</strong>.</p>
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-[#ccc3d8]">From Bucket *</label>
                <BucketGrid :buckets="activeBuckets" v-model="transferForm.from_bucket_id" />
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-[#ccc3d8]">To Bucket *</label>
                <BucketGrid :buckets="activeBuckets" v-model="transferForm.to_bucket_id" :show-unassigned="false" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-[#ccc3d8] mb-1">Amount to Move (₹) *</label>
                <input 
                  v-model="transferForm.amount"
                  type="text"
                  inputmode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  autocomplete="off"
                  placeholder="0.00"
                  required
                  @focus="$event.target.scrollIntoView({ behavior: 'smooth', block: 'center' })"
                  class="w-full px-3.5 py-2.5 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-[#ccc3d8] mb-1">Reason / Description (Optional)</label>
                <input 
                  v-model="transferForm.description"
                  type="text"
                  placeholder="e.g. Reallocating trip funds to laptop"
                  @focus="$event.target.scrollIntoView({ behavior: 'smooth', block: 'center' })"
                  class="w-full px-3.5 py-2.5 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition"
                />
              </div>
            </div>
            <div class="flex justify-end gap-3 px-5 py-3.5 border-t border-[#29293a] bg-[#14141d] shrink-0">
              <button type="button" @click="showTransferModal = false" class="px-4 py-2.5 text-xs font-semibold text-[#9e9cae] hover:text-[#f1f0f5] transition cursor-pointer">Cancel</button>
              <button type="submit" :disabled="submittingTransfer" class="px-4 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-xs rounded-xl transition cursor-pointer disabled:opacity-50">
                {{ submittingTransfer ? 'Transferring...' : 'Transfer Funds' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Account Transfer Modal -->
    <Transition name="modal">
      <div v-if="showAccountTransferModal" class="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 pt-[max(1.5rem,env(safe-area-inset-top))] sm:p-4 bg-[#0f0f15]/80 backdrop-blur-sm overflow-y-auto" @click.self="showAccountTransferModal = false">
        <div class="bg-[#14141d] border border-[#29293a] rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[88vh] my-auto">
          <div class="flex justify-between items-center border-b border-[#29293a] px-5 py-4 shrink-0">
            <div>
              <h3 class="text-base font-bold text-[#f1f0f5]">Transfer Between Accounts</h3>
              <p class="text-[11px] text-[#9e9cae] mt-0.5">Move money between physical accounts</p>
            </div>
            <button @click="showAccountTransferModal = false" class="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 text-[#9e9cae] hover:text-[#f1f0f5] text-lg cursor-pointer">✕</button>
          </div>
          <form @submit.prevent="submitAccountTransfer" class="flex flex-col flex-1 min-h-0">
            <div class="overflow-y-auto p-5 space-y-4 flex-1 pb-14 sm:pb-5">
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-semibold text-[#ccc3d8] mb-1.5">From Account *</label>
                  <AccountGrid :accounts="accounts" v-model="accountTransferForm.from_account_id" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#ccc3d8] mb-1.5">To Account *</label>
                  <AccountGrid :accounts="accounts" v-model="accountTransferForm.to_account_id" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-[#ccc3d8] mb-1">Amount (₹) *</label>
                <input v-model="accountTransferForm.amount" type="text" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" autocomplete="off" placeholder="0.00" required @focus="$event.target.scrollIntoView({ behavior: 'smooth', block: 'center' })" class="w-full px-3.5 py-2.5 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-[#ccc3d8] mb-1">Description (Optional)</label>
                <input v-model="accountTransferForm.description" type="text" placeholder="e.g. Moving savings to checking" @focus="$event.target.scrollIntoView({ behavior: 'smooth', block: 'center' })" class="w-full px-3.5 py-2.5 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition" />
              </div>
            </div>
            <div class="flex justify-end gap-3 px-5 py-3.5 border-t border-[#29293a] bg-[#14141d] shrink-0">
              <button type="button" @click="showAccountTransferModal = false" class="px-4 py-2.5 text-xs font-semibold text-[#9e9cae] hover:text-[#f1f0f5] transition cursor-pointer">Cancel</button>
              <button type="submit" :disabled="submittingAccountTransfer" class="px-5 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50">
                {{ submittingAccountTransfer ? 'Transferring...' : 'Transfer Funds' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Salary Allocation Presets Modal -->
    <Transition name="modal">
      <div v-if="showPresetsModal" class="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 pt-[max(1rem,env(safe-area-inset-top))] sm:p-4 bg-[#0f0f15]/80 backdrop-blur-sm overflow-y-auto" @click.self="showPresetsModal = false; editingPreset = null">
        <div class="bg-[#14141d] border border-[#29293a] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[calc(100dvh-1rem)] my-auto">
          <div class="flex justify-between items-center border-b border-[#29293a] px-5 py-4 shrink-0">
            <div>
              <h3 class="text-base font-bold text-[#f1f0f5]">Salary Allocation Presets</h3>
              <p class="text-[11px] text-[#9e9cae] mt-0.5">Auto-split any amount across your buckets</p>
            </div>
            <button @click="showPresetsModal = false; editingPreset = null" class="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 text-[#9e9cae] hover:text-[#f1f0f5] text-lg cursor-pointer">✕</button>
          </div>
          <div class="overflow-y-auto flex-1 p-5 space-y-4 pb-48 sm:pb-6">
            <div v-if="editingPreset" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-[#ccc3d8] mb-1">Preset Name *</label>
                <input v-model="editingPreset.name" type="text" placeholder="e.g. Monthly Salary Split" @focus="$event.target.scrollIntoView({ behavior: 'smooth', block: 'center' })" class="w-full px-3.5 py-2.5 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition font-bold" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-[#ccc3d8] mb-1.5">Preset Mode (Applies to all rules) *</label>
                <div class="grid grid-cols-2 p-1 bg-[#0f0f15] border border-[#29293a] rounded-xl">
                  <button
                    type="button"
                    @click="editingPreset.mode = 'percentage'"
                    class="py-1.5 text-xs font-bold rounded-lg transition cursor-pointer"
                    :class="editingPreset.mode === 'percentage' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
                  >
                    % Percentage
                  </button>
                  <button
                    type="button"
                    @click="editingPreset.mode = 'fixed'"
                    class="py-1.5 text-xs font-bold rounded-lg transition cursor-pointer"
                    :class="editingPreset.mode === 'fixed' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
                  >
                    ₹ Fixed Amounts
                  </button>
                </div>
              </div>
              <div class="bg-[#1a1a24] border border-[#29293a] rounded-xl p-3 flex justify-around text-center">
                <div>
                  <p class="text-[9px] uppercase tracking-wider text-[#9e9cae] font-bold">Total Percentage</p>
                  <p class="text-sm font-black mt-0.5" :class="editingPresetTotalPercentage > 100 ? 'text-[#FFD1B3]' : 'text-[#D4BFFF]'">
                    {{ editingPresetTotalPercentage }}%
                  </p>
                </div>
                <div class="w-px bg-[#29293a]"></div>
                <div>
                  <p class="text-[9px] uppercase tracking-wider text-[#9e9cae] font-bold">Total Fixed Amount</p>
                  <p class="text-sm font-black mt-0.5 text-[#B3F5E1]">
                    ₹{{ formatAmount(editingPresetTotalFixed) }}
                  </p>
                </div>
              </div>

              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <label class="text-xs font-bold text-[#ccc3d8] uppercase tracking-wider">Allocation Rules</label>
                  <button
                    type="button"
                    @click="editingPreset.rules.unshift({ id: 'new-' + Date.now() + '-' + Math.random(), bucket_id: activeBuckets[0]?.id || '', account_id: accounts[0]?.id || '', category_id: categories[0]?.id || '', value: '' })"
                    class="px-3 py-1.5 bg-[#D4BFFF]/10 hover:bg-[#D4BFFF]/20 text-[#D4BFFF] text-[10px] font-bold rounded-lg transition cursor-pointer"
                  >
                    + Add Rule
                  </button>
                </div>

                <div class="relative min-h-[50px]">
                  <TransitionGroup
                    tag="div"
                    class="space-y-3"
                    enter-active-class="transition-all duration-300 ease-out"
                    enter-from-class="transform opacity-0 translate-y-4 scale-95"
                    enter-to-class="transform opacity-100 translate-y-0 scale-100"
                    leave-active-class="transition-all duration-250 ease-in absolute w-full z-0"
                    leave-from-class="transform opacity-100 translate-y-0 scale-100"
                    leave-to-class="transform opacity-0 translate-y-4 scale-95"
                    move-class="transition-all duration-300 ease-in-out"
                  >
                    <div
                      v-for="(rule, idx) in editingPreset.rules"
                      :key="rule.id || idx"
                      class="bg-[#0f0f15] border border-[#29293a] rounded-xl p-3.5 space-y-3 relative transition-all duration-300"
                    >
                      <div class="flex items-center gap-1.5 border-b border-[#29293a]/40 pb-2 mr-6">
                        <span class="text-[10px] px-2 py-0.5 rounded-md bg-[#29293a]/50 text-[#D4BFFF] font-black uppercase tracking-wider">
                          Rule #{{ editingPreset.rules.length - idx }}
                        </span>
                      </div>
                      <button
                        type="button"
                        @click="editingPreset.rules.splice(idx, 1)"
                        class="absolute top-3 right-3 text-[#9e9cae] hover:text-[#FFD1B3] text-xs font-bold transition cursor-pointer p-1"
                        title="Remove Rule"
                      >
                        ✕
                      </button>
                      <div class="space-y-2">
                        <div>
                          <label class="block text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider mb-1">Target Savings Bucket *</label>
                          <BucketGrid :buckets="activeBuckets" v-model="rule.bucket_id" />
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label class="block text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider mb-1">Deposit Account *</label>
                            <AccountGrid :accounts="accounts" v-model="rule.account_id" />
                          </div>
                          <div>
                            <label class="block text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider mb-1">Transaction Category *</label>
                            <CategoryPicker :categories="categories" v-model="rule.category_id" />
                          </div>
                        </div>
                        <div>
                          <label class="block text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider mb-1">
                            {{ editingPreset.mode === 'percentage' ? 'Percentage Allocation (%)*' : 'Fixed Amount (₹)*' }}
                          </label>
                          <div class="relative flex items-center">
                            <span v-if="editingPreset.mode === 'fixed'" class="absolute left-3 text-xs font-bold text-[#9e9cae] pointer-events-none">₹</span>
                            <input
                              v-model="rule.value"
                              type="text"
                              inputmode="decimal"
                              :placeholder="editingPreset.mode === 'percentage' ? '25' : '1000.00'"
                              required
                              class="w-full px-3 py-2 bg-[#14141d] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-xs font-bold focus:outline-none transition text-right"
                              :class="editingPreset.mode === 'fixed' ? 'pl-6 pr-3' : 'px-3'"
                            />
                            <span v-if="editingPreset.mode === 'percentage'" class="absolute right-3 text-xs font-bold text-[#9e9cae] pointer-events-none">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TransitionGroup>
                </div>
                <p v-if="!editingPreset.rules.length" class="text-xs text-[#9e9cae] text-center py-4 border border-dashed border-[#29293a] rounded-xl">No rules yet. Click "+ Add Rule" to begin.</p>
              </div>

              <div class="flex justify-end gap-3 pt-1">
                <button type="button" @click="editingPreset = null" class="px-4 py-2.5 text-xs font-semibold text-[#9e9cae] hover:text-[#f1f0f5] transition cursor-pointer">Cancel</button>
                <button @click="savePreset" :disabled="submittingPreset" class="px-5 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50">
                  {{ submittingPreset ? 'Saving...' : editingPreset.id ? 'Save Changes' : 'Create Preset' }}
                </button>
              </div>
            </div>

            <div v-else-if="applyingPreset" class="space-y-4">
              <div class="bg-[#1a1a24] border border-[#29293a] rounded-xl p-3.5 flex justify-between items-center">
                <div>
                  <p class="text-[9px] uppercase tracking-wider text-[#9e9cae] font-bold">Unallocated Account Balance</p>
                  <p class="text-[10px] text-[#9e9cae] mt-0.5">Total unallocated cash in bank accounts</p>
                </div>
                <p class="text-sm font-black text-[#B3F5E1]">
                  ₹{{ formatAmount(unassignedAmount) }}
                </p>
              </div>
              <div class="p-3 bg-[#1a1030]/50 border border-[#D4BFFF]/15 rounded-xl">
                <p class="text-xs font-bold text-[#D4BFFF]">Applying: {{ applyingPreset.name }} ({{ applyingPreset.mode === 'percentage' ? 'Percentage' : 'Fixed' }})</p>
                <div class="flex flex-wrap gap-1.5 mt-1.5">
                  <span v-for="rule in applyingPreset.rules" :key="rule.id" class="text-[10px] px-2.5 py-1 rounded-lg bg-[#14141d] border border-[#29293a] text-[#9e9cae] inline-flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-xs shrink-0" :style="{ color: getCategoryColor(rule.category_id) }">{{ resolveIcon(getCategoryIcon(rule.category_id), 'category') }}</span>
                    <span>{{ getBucketName(rule.bucket_id) }} ({{ getAccountName(rule.account_id) }}) · {{ getCategoryName(rule.category_id) }} · {{ applyingPreset.mode === 'percentage' ? rule.value + '%' : '₹' + formatAmount(rule.value) }}</span>
                  </span>
                </div>
              </div>
              <div class="p-3 bg-[#0f0f15] border border-[#29293a] rounded-xl text-xs text-[#9e9cae] flex items-center justify-between">
                <span>Source Funds:</span>
                <span class="font-bold text-[#f1f0f5]">Unallocated Pool (₹{{ formatAmount(unassignedAmount) }})</span>
              </div>
              <div v-if="applyingPreset.mode === 'percentage'" class="space-y-1.5">
                <label class="block text-xs font-semibold text-[#ccc3d8]">Enter Total Salary Deposit Amount (₹) *</label>
                <input v-model="presetBaseAmount" type="text" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" placeholder="e.g. 50000" class="w-full px-3.5 py-2.5 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition font-bold" />
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" @click="applyingPreset = null" class="px-4 py-2.5 text-xs font-semibold text-[#9e9cae] hover:text-[#f1f0f5] transition cursor-pointer">Cancel</button>
                <button @click="confirmApplyPreset" :disabled="submittingPreset || (applyingPreset.mode === 'percentage' && !presetBaseAmount)" class="px-5 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50">
                  {{ submittingPreset ? 'Processing...' : 'Execute Salary Split' }}
                </button>
              </div>
            </div>

            <div v-else>
              <div v-if="localPresets.length > 0" class="space-y-2.5 mb-4">
                <div
                  v-for="preset in localPresets"
                  :key="preset.id"
                  class="bg-[#0f0f15] border border-[#29293a] rounded-xl p-3.5 transition-all duration-200 cursor-pointer hover:bg-[#191924]/30"
                  @click="expandedPresetId = expandedPresetId === preset.id ? null : preset.id"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-black text-[#f1f0f5]">{{ preset.name }}</span>
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#14141d] border border-[#29293a] text-[#9e9cae]">
                        {{ preset.rules.length }} {{ preset.rules.length === 1 ? 'rule' : 'rules' }}
                      </span>
                      <span class="text-[10px] text-[#D4BFFF] font-bold">{{ expandedPresetId === preset.id ? '▲' : '▼' }}</span>
                    </div>
                  </div>
                  <div
                    class="overflow-hidden transition-all duration-300 ease-in-out"
                    :class="expandedPresetId === preset.id ? 'max-h-[500px] mt-3.5 pt-3.5 border-t border-[#29293a]/50 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'"
                    @click.stop
                  >
                    <div class="space-y-3">
                      <div class="flex flex-wrap gap-1.5">
                        <span v-for="rule in preset.rules" :key="rule.id" class="text-[10px] px-2.5 py-1 rounded-lg bg-[#14141d] border border-[#29293a] text-[#dae2fd] inline-flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-xs shrink-0" :style="{ color: getCategoryColor(rule.category_id) }">{{ resolveIcon(getCategoryIcon(rule.category_id), 'category') }}</span>
                          <span>{{ getBucketName(rule.bucket_id) }} ({{ getAccountName(rule.account_id) }}) · {{ getCategoryName(rule.category_id) }} · {{ rule.mode === 'percentage' ? rule.value + '%' : '₹' + formatAmount(rule.value) }}</span>
                        </span>
                      </div>
                      <div class="flex justify-end gap-2.5 pt-1">
                        <button @click="startApplyPreset(preset)" class="px-3.5 py-1.5 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-black text-[10px] rounded-lg cursor-pointer transition shadow-sm">
                          Apply Preset
                        </button>
                        <button @click="editingPreset = JSON.parse(JSON.stringify(preset))" class="px-3.5 py-1.5 bg-[#29293a] hover:bg-[#363648] text-[#ccc3d8] font-bold text-[10px] rounded-lg cursor-pointer transition">
                          Edit
                        </button>
                        <button @click="deletePreset(preset.id)" class="px-2.5 py-1.5 text-[#9e9cae] hover:text-[#FFD1B3] cursor-pointer transition text-xs font-bold">
                          ✕ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p v-else class="text-xs text-[#9e9cae] text-center py-6 border border-dashed border-[#29293a] rounded-xl mb-4">No presets yet. Create your first one below.</p>
              <button @click="editingPreset = { id: null, name: '', mode: 'percentage', rules: [] }" class="w-full py-2.5 border border-dashed border-[#29293a] hover:border-[#D4BFFF]/40 text-[#9e9cae] hover:text-[#D4BFFF] text-xs font-bold rounded-xl transition cursor-pointer">+ New Preset</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <CategoryFormModal 
      :isOpen="showCategoryModal"
      :category="activeEditingCategory"
      @close="showCategoryModal = false"
      @save="handleSaveCategory"
    />

    <BucketFormModal 
      :isOpen="showBucketModal"
      :bucket="activeEditingBucket"
      @close="showBucketModal = false"
      @save="handleSaveBucket"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import BucketGrid from './BucketGrid.vue';
import AccountGrid from './AccountGrid.vue';
import CategoryFormModal from './CategoryFormModal.vue';
import BucketFormModal from './BucketFormModal.vue';
import CategoryPicker from './CategoryPicker.vue';
import { resolveIcon } from '../utils/iconResolver.js';
import { api } from '../services/api';

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);

const activeSheet = ref(null); // null, 'quick_actions', 'buckets', 'accounts', 'categories', 'backup', 'faq', 'unassigned_audit'
const unassignedAuditLogs = ref([]);

const openAdjustmentAuditSheet = async () => {
  activeSheet.value = 'adjustment_audit';
  try {
    unassignedAuditLogs.value = await api.getAdjustmentAuditLogs();
  } catch (err) {
    console.error('Failed to load adjustment audit logs:', err);
  }
};

const openUnassignedAuditSheet = openAdjustmentAuditSheet;

const getSheetIcon = (sheet) => {
  switch (sheet) {
    case 'quick_actions': return 'bolt';
    case 'buckets': return 'savings';
    case 'accounts': return 'account_balance';
    case 'categories': return 'category';
    case 'backup': return 'database';
    case 'faq': return 'help_outline';
    case 'adjustment_audit':
    case 'unassigned_audit': return 'history_edu';
    default: return 'widgets';
  }
};

const getSheetTitle = (sheet) => {
  switch (sheet) {
    case 'quick_actions': return 'Quick Actions';
    case 'buckets': return 'Savings Buckets';
    case 'accounts': return 'Manage Accounts';
    case 'categories': return 'Manage Categories';
    case 'backup': return 'Backup & Export';
    case 'faq': return 'FAQ & About';
    case 'adjustment_audit':
    case 'unassigned_audit': return 'Balance Adjustments & Audit Log';
    default: return 'More';
  }
};

const updateOnlineStatus = () => {
  isOnline.value = typeof navigator !== 'undefined' ? navigator.onLine : true;
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }
});


const props = defineProps({
  accounts: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
  buckets: { type: Array, default: () => [] }
});

const emit = defineEmits([
  'create-account', 'update-account', 'delete-account',
  'create-category', 'update-category', 'delete-category',
  'create-bucket', 'update-bucket', 'delete-bucket', 'transfer-bucket', 'transfer-accounts',
  'reorder-buckets', 'reorder-categories', 'allocate-unassigned', 'data-refresh', 'open-tutorial'
]);

const formatAmount = (val) => {
  const num = Number(val) || 0;
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Account Form & List State
const newAccount = ref({ name: '', type: 'Checking' });
const submittingAccount = ref(false);
const editingAccountId = ref(null);
const editAccountName = ref('');
const editAccountType = ref('Checking');

const userAccounts = computed(() => props.accounts || []);

const submitAccount = () => {
  if (!newAccount.value.name.trim()) return;
  submittingAccount.value = true;
  emit('create-account', {
    name: newAccount.value.name.trim(),
    type: newAccount.value.type
  });
  newAccount.value = { name: '', type: 'Checking' };
  submittingAccount.value = false;
};

const startEditAccount = (account) => {
  editingAccountId.value = account.id;
  editAccountName.value = account.name;
  editAccountType.value = account.type;
};

const cancelEditAccount = () => {
  editingAccountId.value = null;
};

const saveAccountEdit = (account) => {
  const name = editAccountName.value.trim();
  if (!name) return;
  emit('update-account', account.id, {
    name,
    type: editAccountType.value
  });
  editingAccountId.value = null;
};

const confirmDeleteAccount = (account) => {
  const confirm = window.confirm(`Are you sure you want to delete the account "${account.name}"?`);
  if (confirm) {
    emit('delete-account', account.id);
  }
};

// Category Modal & Form State
const showCategoryModal = ref(false);
const activeEditingCategory = ref(null);

const openCreateCategoryModal = () => {
  activeEditingCategory.value = null;
  showCategoryModal.value = true;
};

const openEditCategoryModal = (cat) => {
  activeEditingCategory.value = cat;
  showCategoryModal.value = true;
};

const handleSaveCategory = (payload) => {
  if (!payload) return;
  const { id, ...data } = payload;
  if (id) {
    emit('update-category', id, data);
  } else {
    emit('create-category', data);
  }
  showCategoryModal.value = false;
};

const confirmDeleteCategory = (category) => {
  const confirm = window.confirm(`Are you sure you want to delete the category "${category.name}"?`);
  if (confirm) {
    emit('delete-category', category.id);
  }
};

// Bucket Modal & Form State
const showBucketModal = ref(false);
const activeEditingBucket = ref(null);
const showArchivedBuckets = ref(false);

const activeBuckets = computed(() => (props.buckets || []).filter(b => !b.is_archived));
const displayedBuckets = computed(() => {
  const list = props.buckets || [];
  return showArchivedBuckets.value ? list : list.filter(b => !b.is_archived);
});

const totalAllocated = computed(() => {
  return (props.buckets || []).reduce((sum, b) => {
    if (b.is_archived) return sum;
    return sum + (Number(b.allocated_balance) || 0);
  }, 0);
});

const totalAccountBalance = computed(() => {
  return (props.accounts || []).reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
});

const unassignedAmount = computed(() => {
  const unallocAcc = (props.accounts || []).find(a => a.id === 'acc_unallocated_funds');
  if (unallocAcc) return Number(unallocAcc.balance) || 0;
  return Math.max(0, totalAccountBalance.value - totalAllocated.value);
});

const showAllocateModal = ref(false);
const submittingAllocate = ref(false);
const allocateForm = ref({
  bucket_id: '',
  category_id: '',
  amount: '',
  description: ''
});

const openAllocateModal = (targetBucketId = null) => {
  allocateForm.value = {
    bucket_id: targetBucketId || activeBuckets.value[0]?.id || '',
    category_id: props.categories[0]?.id || '',
    amount: '',
    description: ''
  };
  showAllocateModal.value = true;
};

const submitAllocateFromUnallocated = async () => {
  const amt = Math.round(Number(String(allocateForm.value.amount).replace(',', '.')) * 100) / 100;
  if (!amt || amt <= 0) {
    alert('Please enter a valid allocation amount.');
    return;
  }
  if (!allocateForm.value.bucket_id) {
    alert('Please select a target bucket.');
    return;
  }
  if (amt > unassignedAmount.value) {
    alert(`Allocation exceeds available unallocated funds (₹${unassignedAmount.value.toFixed(2)} available).`);
    return;
  }

  submittingAllocate.value = true;
  try {
    await api.allocateUnassigned({
      bucket_id: allocateForm.value.bucket_id,
      category_id: allocateForm.value.category_id || null,
      amount: amt,
      description: allocateForm.value.description
    });
    showAllocateModal.value = false;
    emit('data-refresh');
  } catch (err) {
    alert(err.message || 'Failed to allocate funds.');
  } finally {
    submittingAllocate.value = false;
  }
};

const openCreateBucketModal = () => {
  activeEditingBucket.value = null;
  showBucketModal.value = true;
};

const openEditBucketModal = (bucket) => {
  activeEditingBucket.value = bucket;
  showBucketModal.value = true;
};

const handleSaveBucket = (payload) => {
  if (!payload) return;
  const { id, ...data } = payload;
  if (id) {
    emit('update-bucket', id, data);
  } else {
    emit('create-bucket', data);
  }
  showBucketModal.value = false;
};

const confirmDeleteBucket = (bucket) => {
  const allocation = formatAmount(bucket.allocated_balance);
  const confirm = window.confirm(`Permanently delete the bucket "${bucket.name}" and remove its ₹${allocation} allocation? Transaction history will be kept, but it will no longer reference this bucket. This cannot be undone.`);
  if (confirm) {
    emit('delete-bucket', bucket.id);
  }
};

const allocateToBucket = (bucket) => {
  openAllocateModal(bucket?.id);
};

// Quick Actions & Transfer Modals
const showTransferModal = ref(false);
const submittingTransfer = ref(false);
const transferForm = ref({ from_bucket_id: '', to_bucket_id: '', amount: '', description: '' });

const submitBucketTransfer = () => {
  if (!transferForm.value.from_bucket_id || !transferForm.value.to_bucket_id || !transferForm.value.amount) {
    alert('Please select both buckets and enter an amount.');
    return;
  }
  submittingTransfer.value = true;
  emit('transfer-bucket', {
    from_bucket_id: transferForm.value.from_bucket_id,
    to_bucket_id: transferForm.value.to_bucket_id,
    amount: Number(transferForm.value.amount),
    description: transferForm.value.description
  });
  submittingTransfer.value = false;
  showTransferModal.value = false;
  transferForm.value = { from_bucket_id: '', to_bucket_id: '', amount: '', description: '' };
};

const showAccountTransferModal = ref(false);
const submittingAccountTransfer = ref(false);
const accountTransferForm = ref({ from_account_id: '', to_account_id: '', amount: '', description: '' });

const submitAccountTransfer = () => {
  if (!accountTransferForm.value.from_account_id || !accountTransferForm.value.to_account_id || !accountTransferForm.value.amount) {
    alert('Please select both accounts and enter an amount.');
    return;
  }
  submittingAccountTransfer.value = true;
  emit('transfer-accounts', {
    from_account_id: accountTransferForm.value.from_account_id,
    to_account_id: accountTransferForm.value.to_account_id,
    amount: Number(accountTransferForm.value.amount),
    description: accountTransferForm.value.description
  });
  submittingAccountTransfer.value = false;
  showAccountTransferModal.value = false;
  accountTransferForm.value = { from_account_id: '', to_account_id: '', amount: '', description: '' };
};

// Presets State & Helpers
const showPresetsModal = ref(false);
const localPresets = ref([]);
const editingPreset = ref(null);
const applyingPreset = ref(null);
const presetBaseAmount = ref('');
const submittingPreset = ref(false);
const expandedPresetId = ref(null);

const loadPresets = async () => {
  try {
    localPresets.value = await api.getPresets();
  } catch (err) {
    console.error('Failed to load presets:', err);
  }
};

const getBucketName = (id) => {
  if (!id) return 'General / No Bucket';
  return (props.buckets || []).find(b => b.id === id)?.name || 'Unknown Bucket';
};
const getAccountName = (id) => (props.accounts || []).find(a => a.id === id)?.name || 'Unknown Account';
const getCategoryName = (id) => (props.categories || []).find(c => c.id === id)?.name || 'Unknown Category';
const getCategoryIcon = (id) => (props.categories || []).find(c => c.id === id)?.icon || '🏷️';
const getCategoryColor = (id) => (props.categories || []).find(c => c.id === id)?.color || '#D4BFFF';

const startApplyPreset = (preset) => {
  applyingPreset.value = JSON.parse(JSON.stringify(preset));
  presetBaseAmount.value = '';
};

const confirmApplyPreset = async () => {
  if (!applyingPreset.value) return;
  submittingPreset.value = true;
  try {
    let base = 0;
    if (applyingPreset.value.mode === 'percentage') {
      base = Number(presetBaseAmount.value);
      if (!base || base <= 0) {
        alert('Please enter a valid deposit amount.');
        submittingPreset.value = false;
        return;
      }
    }
    await api.applyPreset({
      preset_id: applyingPreset.value.id,
      base_amount: base
    });
    emit('data-refresh');
    applyingPreset.value = null;
    showPresetsModal.value = false;
  } catch (err) {
    alert(err.message);
  } finally {
    submittingPreset.value = false;
  }
};

const savePreset = async () => {
  if (!editingPreset.value?.name?.trim() || !editingPreset.value.rules.length) {
    alert('Please add a name and at least one rule.');
    return;
  }
  submittingPreset.value = true;
  try {
    const rules = editingPreset.value.rules.map(r => ({
      bucket_id: r.bucket_id || null,
      account_id: r.account_id || null,
      category_id: r.category_id || null,
      mode: editingPreset.value.mode,
      value: Number(r.value)
    }));
    let saved;
    if (editingPreset.value.id) {
      saved = await api.updatePreset(editingPreset.value.id, { name: editingPreset.value.name, mode: editingPreset.value.mode, rules });
    } else {
      saved = await api.createPreset({ name: editingPreset.value.name, mode: editingPreset.value.mode, rules });
    }
    await loadPresets();
    if (saved && saved.id) {
      expandedPresetId.value = saved.id;
    } else if (localPresets.value.length > 0) {
      expandedPresetId.value = localPresets.value[0].id;
    }
    editingPreset.value = null;
  } catch (err) {
    alert(err.message);
  } finally {
    submittingPreset.value = false;
  }
};

const deletePreset = async (id) => {
  if (!confirm('Delete this preset?')) return;
  try {
    await api.deletePreset(id);
    await loadPresets();
  } catch (err) { alert(err.message); }
};

const editingPresetTotalPercentage = computed(() => {
  if (!editingPreset.value || !editingPreset.value.rules || editingPreset.value.mode !== 'percentage') return 0;
  return editingPreset.value.rules.reduce((sum, r) => sum + (Number(r.value) || 0), 0);
});

const editingPresetTotalFixed = computed(() => {
  if (!editingPreset.value || !editingPreset.value.rules || editingPreset.value.mode !== 'fixed') return 0;
  return editingPreset.value.rules.reduce((sum, r) => sum + (Number(r.value) || 0), 0);
});

const moveBucketPriority = (idx, direction) => {
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= displayedBuckets.value.length) return;
  const list = [...displayedBuckets.value];
  const [moved] = list.splice(idx, 1);
  list.splice(newIdx, 0, moved);
  const ids = list.map(b => b.id);
  emit('reorder-buckets', ids);
};

const moveCategoryPriority = (idx, direction) => {
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= props.categories.length) return;
  const list = [...props.categories];
  const [moved] = list.splice(idx, 1);
  list.splice(newIdx, 0, moved);
  const ids = list.map(c => c.id);
  emit('reorder-categories', ids);
};

const exportUrl = computed(() => api.exportDatabaseUrl());
const backupsList = ref([]);
const creatingBackup = ref(false);


const loadBackupsList = async () => {
  try {
    backupsList.value = await api.getBackups();
  } catch (err) {
    console.error('Failed to load backups list:', err);
  }
};

onMounted(() => {
  loadBackupsList();
  loadSettings();
});

watch(showPresetsModal, (val) => {
  if (val) loadPresets();
});

const handleCreateSnapshot = async () => {
  creatingBackup.value = true;
  try {
    const res = await api.createBackup();
    alert(`Snapshot backup created: ${res.backup_filename}`);
    await loadBackupsList();
  } catch (err) {
    alert(`Failed to create backup: ${err.message}`);
  } finally {
    creatingBackup.value = false;
  }
};

const handleImportBackupFile = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const res = await api.importVault(file);
    alert(`Successfully imported backup file "${file.name}"! Vault loaded: ${res.active_vault}. Reloading application...`);
    window.location.reload();
  } catch (err) {
    if (!/cancelled/i.test(err.message)) alert(`Failed to import backup file: ${err.message}`);
  } finally {
    event.target.value = '';
  }
};

const handleRestoreBackup = async (filename) => {
  if (confirm(`Are you sure you want to restore database from backup "${filename}"? Current data will be overwritten.`)) {
    try {
      await api.restoreBackup(filename);
      alert(`Successfully restored database from backup! Application will reload.`);
      window.location.reload();
    } catch (err) {
      alert(`Failed to restore backup: ${err.message}`);
    }
  }
};

const handleExportActiveDatabase = async () => {
  try {
    await api.exportActiveDatabase();
  } catch (err) {
    alert(`Failed to export database: ${err.message}`);
  }
};

const handleDownloadBackup = async (filename) => {
  try {
    await api.downloadBackupFile(filename);
  } catch (err) {
    if (!/cancelled/i.test(err.message)) alert(err.message || 'Failed to download backup.');
  }
};

const handleShareBackup = async (filename) => {
  try {
    await api.shareBackupFile(filename);
  } catch (err) {
    alert(err.message || 'Failed to share backup file.');
  }
};

const formatSize = (bytes) => {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};
</script>
