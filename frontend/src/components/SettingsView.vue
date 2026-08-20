<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div>
        <h2 class="text-xl font-black text-[#f1f0f5] tracking-tight">Settings</h2>
        <p class="text-xs text-[#9e9cae]">Manage storage accounts, categories, and savings buckets.</p>
      </div>
    </div>

    <!-- Quick Actions Section -->
    <div class="bg-[#14141d] border border-[#29293a] rounded-xl p-4 shadow-sm space-y-3">
      <div>
        <h3 class="text-[10px] font-extrabold text-[#D4BFFF] uppercase tracking-wider">Quick Actions</h3>
        <p class="text-[11px] text-[#9e9cae]">Rapid balance operations and allocation presets</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Bucket Transfer Button -->
        <button
          @click="showTransferModal = true"
          class="flex items-center justify-between p-3.5 bg-[#0f0f15] hover:bg-[#191924] border border-[#29293a] hover:border-[#D4BFFF]/40 rounded-xl transition cursor-pointer text-left group"
        >
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-8 h-8 rounded-lg bg-[#D4BFFF]/10 border border-[#D4BFFF]/20 text-[#D4BFFF] flex items-center justify-center text-sm shrink-0 font-bold">⇄</span>
            <div class="min-w-0">
              <p class="text-xs font-bold text-[#f1f0f5]">Bucket Transfer</p>
              <p class="text-[10px] text-[#9e9cae] mt-0.5 truncate">Move allocation between savings buckets</p>
            </div>
          </div>
          <span class="text-xs text-[#9e9cae] group-hover:text-[#D4BFFF] transition">➔</span>
        </button>

        <!-- Account Transfer Button -->
        <button
          @click="showAccountTransferModal = true"
          class="flex items-center justify-between p-3.5 bg-[#0f0f15] hover:bg-[#191924] border border-[#29293a] hover:border-[#D4BFFF]/40 rounded-xl transition cursor-pointer text-left group"
        >
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-8 h-8 rounded-lg bg-[#D4BFFF]/10 border border-[#D4BFFF]/20 text-[#D4BFFF] flex items-center justify-center text-sm shrink-0 font-bold">⇆</span>
            <div class="min-w-0">
              <p class="text-xs font-bold text-[#f1f0f5]">Account Transfer</p>
              <p class="text-[10px] text-[#9e9cae] mt-0.5 truncate">Transfer funds between physical accounts</p>
            </div>
          </div>
          <span class="text-xs text-[#9e9cae] group-hover:text-[#D4BFFF] transition">➔</span>
        </button>

        <!-- Salary Allocation Preset Button -->
        <button
          @click="showPresetsModal = true"
          class="flex items-center justify-between p-3.5 bg-[#0f0f15] hover:bg-[#191924] border border-[#29293a] hover:border-[#D4BFFF]/40 rounded-xl transition cursor-pointer text-left group"
        >
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-8 h-8 rounded-lg bg-[#D4BFFF]/10 border border-[#D4BFFF]/20 text-[#D4BFFF] flex items-center justify-center text-sm shrink-0 font-bold">✦</span>
            <div class="min-w-0">
              <p class="text-xs font-bold text-[#f1f0f5]">Salary Allocation</p>
              <p class="text-[10px] text-[#9e9cae] mt-0.5 truncate">Auto-split deposits into savings buckets</p>
            </div>
          </div>
          <span class="text-xs text-[#9e9cae] group-hover:text-[#D4BFFF] transition font-bold">➔</span>
        </button>
      </div>
    </div>

    <!-- Click Interceptor Overlay for active Emoji Pickers -->
    <div 
      v-if="showNewEmojiPicker || activeEditEmojiPickerId !== null" 
      class="fixed inset-0 z-30" 
      @click="closeAllEmojiPickers"
    ></div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      
      <!-- 1. Savings Buckets Management Card -->
      <div class="bg-[#14141d] border border-[#29293a] rounded-xl p-4 shadow-sm flex flex-col space-y-4">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-sm font-extrabold text-[#f1f0f5] tracking-tight">Savings Buckets</h3>
            <p class="text-xs text-[#9e9cae]">Allocate purposes for your money</p>
          </div>
          <button 
            @click="showArchivedBuckets = !showArchivedBuckets"
            class="text-[11px] font-bold text-[#D4BFFF] hover:underline cursor-pointer"
          >
            {{ showArchivedBuckets ? 'Hide Archived' : 'Show Archived' }}
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="rounded-xl border border-[#29293a] bg-[#0f0f15] p-2.5">
            <p class="text-[9px] font-bold uppercase tracking-wider text-[#D4BFFF]">Total allocated</p>
            <p class="mt-0.5 text-xs font-black text-[#f1f0f5] tabular-nums">₹{{ formatAmount(totalAllocated) }}</p>
          </div>
          <div class="rounded-xl border border-[#29293a] bg-[#0f0f15] p-2.5">
            <p class="text-[9px] font-bold uppercase tracking-wider text-[#FFD1B3]">Unassigned</p>
            <p class="mt-0.5 text-xs font-black text-[#FFD1B3] tabular-nums">₹{{ formatAmount(unassignedAmount) }}</p>
          </div>
        </div>

        <!-- Add Bucket Form -->
        <form @submit.prevent="submitBucket" class="p-3 bg-[#0b1326] border border-[#31394d] rounded-lg space-y-2.5">
          <p class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Add Savings Bucket</p>
          
          <div class="space-y-2">
            <div class="flex gap-2 relative">
              <!-- Emoji Button & Input Trigger -->
              <div class="relative z-50">
                <button
                  type="button"
                  @click="showNewEmojiPicker = !showNewEmojiPicker"
                  class="w-10 h-8 flex items-center justify-center bg-[#131b2e] border border-[#31394d] hover:border-[#7c3aed] rounded-md text-base transition cursor-pointer"
                  title="Click to pick an emoji"
                >
                  {{ newBucket.icon || '🪣' }}
                </button>

                <!-- Emoji Picker Dropdown Overlay for New Bucket -->
                <div 
                  v-if="showNewEmojiPicker" 
                  class="absolute left-0 top-10 z-50 w-64 bg-[#131b2e] border border-[#31394d] rounded-lg p-3 shadow-xl space-y-2"
                >
                  <p class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider mb-1">Select Bucket Emoji</p>
                  <div class="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    <button
                      v-for="emoji in presetEmojis"
                      :key="emoji"
                      type="button"
                      @click="selectNewEmoji(emoji)"
                      class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#0b1326] text-base transition cursor-pointer"
                    >
                      {{ emoji }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Bucket Name -->
              <input 
                v-model="newBucket.name"
                type="text"
                placeholder="Bucket Name"
                required
                class="flex-grow px-3 py-1.5 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-md text-[#dae2fd] text-xs placeholder-slate-500 focus:outline-none transition"
              />
            </div>

            <div class="flex justify-between items-center pt-1">
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-[#ccc3d8] uppercase font-semibold">Color:</span>
                <div class="relative w-6 h-6 rounded-md overflow-hidden border border-[#31394d] bg-[#131b2e] flex items-center justify-center shrink-0">
                  <input 
                    v-model="newBucket.color"
                    type="color"
                    class="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer bg-transparent opacity-0"
                    style="width: 150%; height: 150%; transform: translate(-20%, -20%);"
                  />
                  <div class="w-3 h-3 rounded-full border border-white/20" :style="{ backgroundColor: newBucket.color }"></div>
                </div>
              </div>

              <button 
                type="submit"
                :disabled="submittingBucket"
                class="px-4 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-full transition cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {{ submittingBucket ? 'Creating...' : '+ Create Bucket' }}
              </button>
            </div>
          </div>
        </form>

        <!-- Bucket List -->
        <div class="flex-grow">
          <div v-if="displayedBuckets.length > 0" class="divide-y divide-[#29293a]/80 border border-[#29293a] rounded-xl overflow-hidden bg-[#0f0f15]/20">
            <div 
              v-for="(bucket, idx) in displayedBuckets" 
              :key="bucket.id"
              class="p-3.5 hover:bg-[#0f0f15]/30 transition duration-150"
            >
              <!-- Editing Mode -->
              <div v-if="editingBucketId === bucket.id" class="space-y-3">
                <div class="flex gap-2 relative">
                  <!-- Edit Emoji Trigger -->
                  <div class="relative z-50">
                    <button
                      type="button"
                      @click="activeEditEmojiPickerId = activeEditEmojiPickerId === bucket.id ? null : bucket.id"
                      class="w-10 h-8 flex items-center justify-center bg-[#14141d] border border-[#29293a] hover:border-[#D4BFFF] rounded-lg text-sm transition cursor-pointer"
                    >
                      {{ editBucketIcon || '🪣' }}
                    </button>

                    <!-- Edit Emoji Picker Overlay -->
                    <div 
                      v-if="activeEditEmojiPickerId === bucket.id" 
                      class="absolute left-0 top-10 z-50 w-64 bg-[#14141d] border border-[#29293a] rounded-2xl p-3 shadow-2xl space-y-2"
                    >
                      <p class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider mb-1">Select Bucket Emoji</p>
                      <div class="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto pr-1">
                        <button
                          v-for="emoji in presetEmojis"
                          :key="emoji"
                          type="button"
                          @click="selectEditEmoji(emoji)"
                          class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1a1030] text-base transition cursor-pointer"
                        >
                          {{ emoji }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <input 
                    v-model="editBucketName"
                    type="text"
                    required
                    class="flex-grow px-3 py-1.5 bg-[#14141d] border border-[#29293a] focus:border-[#D4BFFF] rounded-lg text-[#f1f0f5] text-xs focus:outline-none transition"
                  />
                  <!-- Color -->
                  <div class="relative w-8 h-8 rounded-lg overflow-hidden border border-[#29293a] bg-[#14141d] flex items-center justify-center shrink-0">
                    <input 
                      v-model="editBucketColor"
                      type="color"
                      class="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer bg-transparent opacity-0"
                      style="width: 150%; height: 150%; transform: translate(-20%, -20%);"
                    />
                    <div class="w-4 h-4 rounded-full border border-white/20" :style="{ backgroundColor: editBucketColor }"></div>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <label class="flex items-center gap-1.5 text-xs text-[#9e9cae] cursor-pointer">
                    <input type="checkbox" v-model="editBucketArchived" class="rounded border-[#29293a] text-indigo-600 bg-[#14141d]" />
                    <span>Archive Bucket</span>
                  </label>

                  <div class="flex gap-2">
                    <button 
                      type="button"
                      @click="editingBucketId = null"
                      class="px-2.5 py-1 text-[10px] font-semibold text-[#9e9cae] hover:text-[#dae2fd] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      @click="saveBucketEdit(bucket)"
                      class="px-2.5 py-1 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-[10px] rounded-lg transition cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>

              <!-- Normal Mode -->
              <div v-else class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <!-- Up/Down Priority Buttons -->
                  <div class="flex flex-col gap-0.5 shrink-0 mr-0.5">
                    <button 
                      type="button"
                      @click="moveBucketPriority(idx, -1)"
                      :disabled="idx === 0"
                      class="text-[10px] leading-none p-0.5 text-[#9e9cae] hover:text-[#D4BFFF] disabled:opacity-20 cursor-pointer"
                      title="Move Priority Up in Grid"
                    >
                      ▲
                    </button>
                    <button 
                      type="button"
                      @click="moveBucketPriority(idx, 1)"
                      :disabled="idx === displayedBuckets.length - 1"
                      class="text-[10px] leading-none p-0.5 text-[#9e9cae] hover:text-[#D4BFFF] disabled:opacity-20 cursor-pointer"
                      title="Move Priority Down in Grid"
                    >
                      ▼
                    </button>
                  </div>

                  <span class="text-base">{{ bucket.icon || '🪣' }}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <p class="text-xs font-semibold text-[#dae2fd]">{{ bucket.name }}</p>
                      <span v-if="bucket.is_archived" class="px-1.5 py-0.2 text-[9px] font-semibold rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">Archived</span>
                    </div>
                    <p class="text-[10px] text-[#9e9cae] font-medium mt-0.5">
                      Allocated: <span class="text-[#D4BFFF] font-semibold">₹{{ formatAmount(bucket.allocated_balance) }}</span>
                    </p>
                  </div>
                </div>

                <div class="flex gap-1.5">
                  <button
                    v-if="unassignedAmount > 0 && !bucket.is_archived"
                    @click="allocateToBucket(bucket)"
                    class="px-2 py-1.5 rounded-lg border border-amber-800/50 bg-amber-950/40 text-[9px] font-bold text-amber-300"
                    title="Allocate unassigned money"
                  >Allocate</button>
                  <button 
                    @click="startEditBucket(bucket)"
                    class="text-[#9e9cae] hover:text-[#D4BFFF] hover:bg-[#D4BFFF]/8 p-2 rounded-lg transition cursor-pointer"
                    title="Edit Bucket"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    @click="confirmDeleteBucket(bucket)"
                    class="text-[#9e9cae] hover:text-rose-400 hover:bg-rose-950/20 p-2 rounded-lg transition cursor-pointer"
                    title="Delete / Archive Bucket"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-12 border border-dashed border-[#29293a] rounded-xl text-xs text-[#6b6a7d]">
            No savings buckets found.
          </div>
        </div>
      </div>

      <!-- 2. Account Management Card -->
      <div class="bg-[#14141d] border border-[#29293a] rounded-xl p-4 shadow-sm flex flex-col space-y-4">
        <div>
          <h3 class="text-sm font-extrabold text-[#f1f0f5] tracking-tight">Manage Accounts</h3>
          <p class="text-xs text-[#9e9cae]">Create accounts (where money is stored)</p>
        </div>

        <!-- Add Account Form -->
        <form @submit.prevent="submitAccount" class="p-3 bg-[#0f0f15] border border-[#29293a] rounded-xl space-y-3">
          <p class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Add New Account</p>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input 
              v-model="newAccount.name"
              type="text"
              placeholder="Account Name (e.g. SBI)"
              required
              class="w-full px-3 py-1.5 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-md text-[#dae2fd] text-xs placeholder-slate-500 focus:outline-none transition"
            />
            <select 
              v-model="newAccount.type"
              class="w-full px-3 py-1.5 bg-[#131b2e] border border-[#31394d] hover:bg-[#1f2940] focus:border-[#7c3aed] rounded-md text-[#dae2fd] text-xs focus:outline-none transition cursor-pointer"
            >
              <option value="Checking">Checking</option>
              <option value="Savings">Savings</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Cash">Cash</option>
              <option value="Wallet">Wallet</option>
            </select>
          </div>
          <button 
            type="submit"
            :disabled="submittingAccount"
            class="w-full py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-full shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            {{ submittingAccount ? 'Creating...' : '+ Create Account' }}
          </button>
        </form>

        <!-- Account List -->
        <div class="flex-grow">
          <div v-if="accounts.length > 0" class="divide-y divide-[#29293a]/80 border border-[#29293a] rounded-xl overflow-hidden bg-[#0f0f15]/20">
            <div 
              v-for="account in accounts" 
              :key="account.id"
              class="p-3.5 hover:bg-[#0f0f15]/30 transition duration-150"
            >
              <!-- Editing Mode -->
              <div v-if="editingAccountId === account.id" class="space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input 
                    v-model="editAccountName"
                    type="text"
                    required
                    class="w-full px-3 py-1.5 bg-[#14141d] border border-[#29293a] focus:border-[#D4BFFF] rounded-lg text-[#f1f0f5] text-xs focus:outline-none transition"
                  />
                  <select 
                    v-model="editAccountType"
                    class="w-full px-2.5 py-1.5 bg-[#14141d] border border-[#29293a] focus:border-[#D4BFFF] rounded-lg text-[#dae2fd] text-xs focus:outline-none transition cursor-pointer"
                  >
                    <option value="Checking">Checking</option>
                    <option value="Savings">Savings</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Wallet">Wallet</option>
                  </select>
                </div>
                <div class="flex justify-end gap-2">
                  <button 
                    type="button"
                    @click="cancelEditAccount"
                    class="px-2.5 py-1 text-[10px] font-semibold text-[#9e9cae] hover:text-[#dae2fd] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    @click="saveAccountEdit(account)"
                    class="px-2.5 py-1 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-[10px] rounded-lg transition cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>

              <!-- Normal Mode -->
              <div v-else class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-semibold text-[#dae2fd]">{{ account.name }}</p>
                  <p class="text-[10px] text-[#9e9cae] mt-0.5">
                    <span class="px-1.5 py-0.5 rounded bg-[#14141d] border border-[#29293a] text-[#9e9cae]">{{ account.type }}</span>
                    <span class="ml-2 font-medium text-[#ccc3d8]">Balance: ₹{{ formatAmount(account.balance) }}</span>
                  </p>
                </div>
                <div class="flex gap-1.5">
                  <button 
                    @click="startEditAccount(account)"
                    class="text-[#9e9cae] hover:text-[#D4BFFF] hover:bg-[#D4BFFF]/8 p-2 rounded-lg transition cursor-pointer"
                    title="Edit Account"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    @click="confirmDeleteAccount(account)"
                    class="text-[#9e9cae] hover:text-rose-400 hover:bg-rose-950/20 p-2 rounded-lg transition cursor-pointer"
                    title="Delete Account"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-12 border border-dashed border-[#29293a] rounded-xl text-xs text-[#6b6a7d]">
            No accounts configured.
          </div>
        </div>
      </div>

      <!-- 3. Category Management Card -->
      <div class="bg-[#14141d] border border-[#29293a] rounded-xl p-4 shadow-sm flex flex-col space-y-4">
        <div>
          <h3 class="text-sm font-extrabold text-[#f1f0f5] tracking-tight">Manage Categories</h3>
          <p class="text-xs text-[#9e9cae]">Create categories (for spending analytics)</p>
        </div>

        <!-- Add Category Form -->
        <form @submit.prevent="submitCategory" class="p-3 bg-[#0f0f15] border border-[#29293a] rounded-xl space-y-3">
          <p class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider">Add New Category</p>
          
          <div class="flex gap-2 items-center">
            <input 
              v-model="newCategory.icon"
              type="text"
              placeholder="Icon"
              class="w-12 px-2 py-1.5 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-md text-[#dae2fd] text-center text-xs focus:outline-none transition"
            />

            <input 
              v-model="newCategory.name"
              type="text"
              placeholder="Category Name"
              required
              class="flex-grow px-3 py-1.5 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-md text-[#dae2fd] text-xs placeholder-slate-500 focus:outline-none transition"
            />
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
            <label class="flex items-center gap-1.5 text-xs text-[#ccc3d8] cursor-pointer">
              <input 
                type="checkbox" 
                v-model="newCategory.is_quick_select" 
                class="rounded border-[#31394d] text-amber-500 bg-[#131b2e] cursor-pointer"
              />
              <span class="text-[11px]">⭐ Pin to Quick Select</span>
            </label>

            <div class="flex items-center gap-2 ml-auto">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] text-[#ccc3d8] uppercase font-semibold">Color:</span>
                <div class="relative w-6 h-6 rounded-md overflow-hidden border border-[#31394d] bg-[#131b2e] flex items-center justify-center shrink-0">
                  <input 
                    v-model="newCategory.color"
                    type="color"
                    class="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer bg-transparent opacity-0"
                    style="width: 150%; height: 150%; transform: translate(-20%, -20%);"
                  />
                  <div class="w-3 h-3 rounded-full border border-white/20" :style="{ backgroundColor: newCategory.color }"></div>
                </div>
              </div>
              <button 
                type="submit"
                :disabled="submittingCategory"
                class="px-5 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-full shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {{ submittingCategory ? 'Creating...' : '+ Create Category' }}
              </button>
            </div>
          </div>
        </form>

        <!-- Category List -->
        <div class="flex-grow">
          <div v-if="categories.length > 0" class="divide-y divide-[#29293a]/80 border border-[#29293a] rounded-xl overflow-hidden bg-[#0f0f15]/20">
            <div 
              v-for="(category, idx) in categories" 
              :key="category.id"
              class="p-3.5 hover:bg-[#0f0f15]/30 transition duration-150"
            >
              <!-- Editing Mode -->
              <div v-if="editingCategoryId === category.id" class="space-y-3">
                <div class="flex gap-2 items-center">
                  <input 
                    v-model="editCategoryIcon"
                    type="text"
                    placeholder="Icon"
                    class="w-12 px-2 py-1.5 bg-[#14141d] border border-[#29293a] focus:border-[#D4BFFF] rounded-lg text-[#f1f0f5] text-center text-xs focus:outline-none transition"
                  />
                  <input 
                    v-model="editCategoryName"
                    type="text"
                    required
                    class="flex-grow px-3 py-1.5 bg-[#14141d] border border-[#29293a] focus:border-[#D4BFFF] rounded-lg text-[#f1f0f5] text-xs focus:outline-none transition"
                  />
                  <div class="relative w-8 h-8 rounded-lg overflow-hidden border border-[#29293a] bg-[#14141d] flex items-center justify-center shrink-0">
                    <input 
                      v-model="editCategoryColor"
                      type="color"
                      class="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer bg-transparent opacity-0"
                      style="width: 150%; height: 150%; transform: translate(-20%, -20%);"
                    />
                    <div class="w-4 h-4 rounded-full border border-white/20" :style="{ backgroundColor: editCategoryColor }"></div>
                  </div>
                </div>
                <div class="flex justify-end gap-2">
                  <button 
                    type="button"
                    @click="cancelEditCategory"
                    class="px-2.5 py-1 text-[10px] font-semibold text-[#9e9cae] hover:text-[#dae2fd] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    @click="saveCategoryEdit(category)"
                    class="px-2.5 py-1 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-[10px] rounded-lg transition cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>

              <!-- Normal Mode -->
              <div v-else class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <!-- Up/Down Priority Buttons -->
                  <div class="flex flex-col gap-0.5 shrink-0 mr-0.5">
                    <button 
                      type="button"
                      @click="moveCategoryPriority(idx, -1)"
                      :disabled="idx === 0"
                      class="text-[10px] leading-none p-0.5 text-[#9e9cae] hover:text-[#D4BFFF] disabled:opacity-20 cursor-pointer"
                      title="Move Priority Up"
                    >
                      ▲
                    </button>
                    <button 
                      type="button"
                      @click="moveCategoryPriority(idx, 1)"
                      :disabled="idx === categories.length - 1"
                      class="text-[10px] leading-none p-0.5 text-[#9e9cae] hover:text-[#D4BFFF] disabled:opacity-20 cursor-pointer"
                      title="Move Priority Down"
                    >
                      ▼
                    </button>
                  </div>
                  <span class="text-base">{{ category.icon || '🏷️' }}</span>
                  <span class="w-3 h-3 rounded-full border border-white/10 shrink-0" :style="{ backgroundColor: category.color }"></span>
                  <p class="text-xs font-semibold text-[#dae2fd]">{{ category.name }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button 
                    @click="$emit('update-category', category.id, { name: category.name, color: category.color, icon: category.icon || '🏷️', is_quick_select: category.is_quick_select ? 0 : 1 })"
                    class="px-2 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                    :class="category.is_quick_select ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40' : 'bg-[#14141d] text-[#9e9cae] border border-[#29293a] hover:text-[#dae2fd]'"
                    :title="category.is_quick_select ? 'Pinned to Quick Select in transaction form' : 'Pin to Quick Select in transaction form'"
                  >
                    <span>{{ category.is_quick_select ? '⭐ Quick Select' : '☆ Pin' }}</span>
                  </button>

                  <button 
                    @click="startEditCategory(category)"
                    class="text-[#9e9cae] hover:text-[#D4BFFF] hover:bg-[#D4BFFF]/8 p-2 rounded-lg transition cursor-pointer"
                    title="Edit Category"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    @click="confirmDeleteCategory(category)"
                    class="text-[#9e9cae] hover:text-rose-400 hover:bg-rose-950/20 p-2 rounded-lg transition cursor-pointer"
                    title="Delete Category"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-12 border border-dashed border-[#29293a] rounded-xl text-xs text-[#6b6a7d]">
            No categories configured.
          </div>
        </div>
      </div>

    </div>



    <!-- 5. Data Management & Database Backups Card -->
    <div class="bg-[#14141d] border border-[#29293a] rounded-2xl p-6 shadow-xl space-y-5">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#29293a] pb-4">
        <div>
          <h3 class="text-base font-bold text-[#f1f0f5] flex items-center gap-2">
            <span>💾</span> Data Backup & Export Controls
          </h3>
          <p class="text-xs text-[#9e9cae] mt-0.5">Export active database file, create local snapshots, or restore backups.</p>
        </div>
        <div class="flex gap-2 shrink-0">
          <a 
            :href="exportUrl"
            download
            class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <span>⬇️ Export Active Database</span>
          </a>
          <button 
            @click="handleCreateSnapshot"
            :disabled="creatingBackup"
            class="px-3.5 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-xs rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <span>{{ creatingBackup ? 'Creating...' : '📸 Create Local Snapshot' }}</span>
          </button>
        </div>
      </div>

      <!-- Local Snapshots List -->
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <p class="text-xs font-semibold text-[#9e9cae] uppercase tracking-wider">Local Snapshots (<code class="text-[#D4BFFF] font-mono">backups/</code>)</p>
          <button @click="loadBackupsList" class="text-xs text-[#D4BFFF] hover:underline cursor-pointer">Refresh List</button>
        </div>

        <div v-if="backupsList.length > 0" class="divide-y divide-[#29293a]/80 border border-[#29293a] rounded-xl overflow-hidden bg-[#0f0f15]/20 max-h-48 overflow-y-auto">
          <div 
            v-for="b in backupsList" 
            :key="b.filename"
            class="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-[#0f0f15]/30 transition gap-2"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="text-base shrink-0">📦</span>
              <div class="truncate">
                <p class="text-xs font-semibold text-[#dae2fd] font-mono truncate">{{ b.filename }}</p>
                <p class="text-[10px] text-[#6b6a7d]">{{ formatSize(b.size_bytes) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <button
                @click="handleDownloadBackup(b.filename)"
                class="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/50 font-semibold text-[10px] rounded-lg transition cursor-pointer flex items-center gap-1"
                title="Download backup file to phone Downloads / Files folder"
              >
                <span>⬇️ Save File</span>
              </button>
              <button 
                @click="handleShareBackup(b.filename)"
                class="px-2.5 py-1 bg-[#1a1030]/80 hover:bg-indigo-900 text-[#D4BFFF] border border-[#D4BFFF]/25 font-semibold text-[10px] rounded-lg transition cursor-pointer flex items-center gap-1"
                title="Share or Save to Google Drive / iCloud / Files app"
              >
                <span>📤 Share</span>
              </button>
              <button 
                @click="handleRestoreBackup(b.filename)"
                class="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-400 border border-amber-800/50 font-semibold text-[10px] rounded-lg transition cursor-pointer"
              >
                Restore
              </button>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-6 border border-dashed border-[#29293a] rounded-xl text-xs text-[#6b6a7d]">
          No snapshot backups saved in <code class="text-[#9e9cae] font-mono">backups/</code> folder yet. Click "Create Local Snapshot" above to save a backup.
        </div>
      </div>
    </div>

    <!-- 5. Frequently Asked Questions (FAQ) Card -->
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

    <!-- 6. ABOUT CASH BUDDY (AT THE VERY BOTTOM) -->
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

    <!-- Bucket Transfer Modal -->
    <div v-if="showTransferModal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-[#0f0f15]/80 backdrop-blur-sm">
      <div class="bg-[#14141d] border border-[#29293a] rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh]">
        <!-- Header -->
        <div class="flex justify-between items-center border-b border-[#29293a] px-5 py-4 shrink-0">
          <h3 class="text-base font-bold text-[#f1f0f5]">Transfer Allocation</h3>
          <button @click="showTransferModal = false" class="text-[#9e9cae] hover:text-[#f1f0f5] text-lg cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="submitBucketTransfer" class="flex flex-col flex-1 min-h-0">
          <!-- Scrollable Body -->
          <div class="overflow-y-auto p-5 space-y-4 flex-1">
            <div class="p-3 bg-[#1a1030]/30 border border-[#D4BFFF]/15 rounded-xl text-xs text-[#ccc3d8]">
              <p>This moves allocated funds from one bucket to another. Your physical <strong>bank account balances remain 100% unchanged</strong>.</p>
            </div>

            <!-- From Bucket -->
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-[#ccc3d8]">From Bucket *</label>
              <BucketGrid :buckets="activeBuckets" v-model="transferForm.from_bucket_id" />
            </div>

            <!-- To Bucket -->
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-[#ccc3d8]">To Bucket *</label>
              <BucketGrid :buckets="activeBuckets" v-model="transferForm.to_bucket_id" :show-unassigned="true" />
            </div>

            <!-- Amount -->
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
                class="w-full px-3.5 py-2.5 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-xs font-semibold text-[#ccc3d8] mb-1">Reason / Description (Optional)</label>
              <input 
                v-model="transferForm.description"
                type="text"
                placeholder="e.g. Reallocating trip funds to laptop"
                class="w-full px-3.5 py-2.5 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition"
              />
            </div>
          </div>

          <!-- Sticky Footer -->
          <div class="flex justify-end gap-3 px-5 py-3.5 border-t border-[#29293a] bg-[#14141d] shrink-0">
            <button 
              type="button" 
              @click="showTransferModal = false" 
              class="px-4 py-2.5 text-xs font-semibold text-[#9e9cae] hover:text-[#f1f0f5] transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              :disabled="submittingTransfer"
              class="px-4 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {{ submittingTransfer ? 'Transferring...' : 'Transfer Funds' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Account Transfer Modal -->
    <div v-if="showAccountTransferModal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-[#0f0f15]/80 backdrop-blur-sm">
      <div class="bg-[#14141d] border border-[#29293a] rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh]">
        <!-- Header -->
        <div class="flex justify-between items-center border-b border-[#29293a] px-5 py-4 shrink-0">
          <div>
            <h3 class="text-base font-bold text-[#f1f0f5]">Transfer Between Accounts</h3>
            <p class="text-[11px] text-[#9e9cae] mt-0.5">Move money between physical accounts</p>
          </div>
          <button @click="showAccountTransferModal = false" class="text-[#9e9cae] hover:text-[#f1f0f5] text-lg cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="submitAccountTransfer" class="flex flex-col flex-1 min-h-0">
          <!-- Scrollable Body -->
          <div class="overflow-y-auto p-5 space-y-4 flex-1">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-[#ccc3d8] mb-1">From Account *</label>
                <select v-model="accountTransferForm.from_account_id" required class="w-full px-3 py-2.5 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition cursor-pointer font-bold">
                  <option value="" disabled>Select</option>
                  <option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.name }} (₹{{ formatAmount(a.balance) }})</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-[#ccc3d8] mb-1">To Account *</label>
                <select v-model="accountTransferForm.to_account_id" required class="w-full px-3 py-2.5 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition cursor-pointer font-bold">
                  <option value="" disabled>Select</option>
                  <option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.name }}</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#ccc3d8] mb-1">Amount (₹) *</label>
              <input v-model="accountTransferForm.amount" type="text" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" autocomplete="off" placeholder="0.00" required class="w-full px-3.5 py-2.5 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition" />
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-[#ccc3d8]">Savings Bucket (Optional)</label>
              <BucketGrid :buckets="activeBuckets" v-model="accountTransferForm.bucket_id" :show-unassigned="true" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#ccc3d8] mb-1">Description (Optional)</label>
              <input v-model="accountTransferForm.description" type="text" placeholder="e.g. Moving savings to checking" class="w-full px-3.5 py-2.5 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition" />
            </div>
          </div>

          <!-- Sticky Footer -->
          <div class="flex justify-end gap-3 px-5 py-3.5 border-t border-[#29293a] bg-[#14141d] shrink-0">
            <button type="button" @click="showAccountTransferModal = false" class="px-4 py-2.5 text-xs font-semibold text-[#9e9cae] hover:text-[#f1f0f5] transition cursor-pointer">Cancel</button>
            <button type="submit" :disabled="submittingAccountTransfer" class="px-5 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50">
              {{ submittingAccountTransfer ? 'Transferring...' : 'Transfer Funds' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Salary Allocation Presets Modal -->
    <div v-if="showPresetsModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f0f15]/80 backdrop-blur-sm">
      <div class="bg-[#14141d] border border-[#29293a] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="flex justify-between items-center border-b border-[#29293a] px-5 py-4">
          <div>
            <h3 class="text-base font-bold text-[#f1f0f5]">Salary Allocation Presets</h3>
            <p class="text-[11px] text-[#9e9cae] mt-0.5">Auto-split any amount across your buckets</p>
          </div>
          <button @click="showPresetsModal = false; editingPreset = null" class="text-[#9e9cae] hover:text-[#f1f0f5] text-lg cursor-pointer">✕</button>
        </div>

        <div class="overflow-y-auto flex-1 p-5 space-y-4">
          <!-- Apply / List view -->
          <div v-if="!editingPreset">
            <!-- Existing presets -->
            <div v-if="localPresets.length > 0" class="space-y-2 mb-4">
              <div
                v-for="preset in localPresets"
                :key="preset.id"
                class="bg-[#0f0f15] border border-[#29293a] rounded-xl p-3 space-y-2"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#f1f0f5]">{{ preset.name }}</span>
                  <div class="flex gap-2">
                    <button @click="startApplyPreset(preset)" class="px-3 py-1 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-black text-[10px] rounded-lg cursor-pointer transition">Apply</button>
                    <button @click="editingPreset = JSON.parse(JSON.stringify(preset))" class="px-3 py-1 bg-[#29293a] hover:bg-[#363648] text-[#ccc3d8] font-bold text-[10px] rounded-lg cursor-pointer transition">Edit</button>
                    <button @click="deletePreset(preset.id)" class="px-2 py-1 text-[#9e9cae] hover:text-[#FFD1B3] cursor-pointer transition text-xs">✕</button>
                  </div>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="rule in preset.rules" :key="rule.id" class="text-[10px] px-2 py-0.5 rounded-full bg-[#14141d] border border-[#29293a] text-[#9e9cae]">
                    {{ getBucketName(rule.bucket_id) }} · {{ rule.mode === 'percentage' ? rule.value + '%' : '₹' + formatAmount(rule.value) }}
                  </span>
                </div>
              </div>
            </div>
            <p v-else class="text-xs text-[#9e9cae] text-center py-4">No presets yet. Create your first one below.</p>
            <button @click="editingPreset = { id: null, name: '', rules: [] }" class="w-full py-2.5 border border-dashed border-[#29293a] hover:border-[#D4BFFF]/40 text-[#9e9cae] hover:text-[#D4BFFF] text-xs font-bold rounded-xl transition cursor-pointer">+ New Preset</button>
          </div>

          <!-- Apply preset form -->
          <div v-else-if="applyingPreset" class="space-y-4">
            <div class="p-3 bg-[#1a1030]/50 border border-[#D4BFFF]/15 rounded-xl">
              <p class="text-xs font-bold text-[#D4BFFF]">Applying: {{ applyingPreset.name }}</p>
              <div class="flex flex-wrap gap-1.5 mt-1.5">
                <span v-for="rule in applyingPreset.rules" :key="rule.id" class="text-[10px] px-2 py-0.5 rounded-full bg-[#14141d] border border-[#29293a] text-[#9e9cae]">
                  {{ getBucketName(rule.bucket_id) }} · {{ rule.mode === 'percentage' ? rule.value + '%' : '₹' + formatAmount(rule.value) }}
                </span>
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#ccc3d8] mb-1">Total Amount Received (₹) *</label>
              <input v-model="applyForm.total_amount" type="text" inputmode="decimal" placeholder="e.g. 50000" class="w-full px-3.5 py-2 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#ccc3d8] mb-1">Deposit to Account *</label>
              <select v-model="applyForm.account_id" class="w-full px-3 py-2 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition cursor-pointer">
                <option value="" disabled>Select Account</option>
                <option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.name }} (₹{{ formatAmount(a.balance) }})</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#ccc3d8] mb-1">Description (Optional)</label>
              <input v-model="applyForm.description" type="text" placeholder="e.g. August salary" class="w-full px-3.5 py-2 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition" />
            </div>
            <div class="flex justify-end gap-3 pt-1">
              <button type="button" @click="applyingPreset = null" class="px-4 py-2 text-xs font-semibold text-[#9e9cae] hover:text-[#f1f0f5] transition cursor-pointer">Back</button>
              <button @click="submitApplyPreset" :disabled="submittingPreset" class="px-4 py-2 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-black text-xs rounded-xl transition cursor-pointer disabled:opacity-50">
                {{ submittingPreset ? 'Applying...' : 'Apply & Allocate' }}
              </button>
            </div>
          </div>

          <!-- Create / Edit preset form -->
          <div v-else class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-[#ccc3d8] mb-1">Preset Name *</label>
              <input v-model="editingPreset.name" type="text" placeholder="e.g. Monthly Salary Split" class="w-full px-3.5 py-2.5 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs focus:outline-none transition font-bold" />
            </div>

            <!-- Allocation Summary Dashboard -->
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
                  @click="editingPreset.rules.push({ bucket_id: activeBuckets[0]?.id || '', mode: 'percentage', value: '' })"
                  class="px-3 py-1.5 bg-[#D4BFFF]/10 hover:bg-[#D4BFFF]/20 text-[#D4BFFF] text-[10px] font-bold rounded-lg transition cursor-pointer"
                >
                  + Add Rule
                </button>
              </div>

              <!-- Rule Cards -->
              <div v-for="(rule, idx) in editingPreset.rules" :key="idx" class="bg-[#0f0f15] border border-[#29293a] rounded-xl p-3.5 space-y-3 relative">
                <!-- Delete Button -->
                <button
                  type="button"
                  @click="editingPreset.rules.splice(idx, 1)"
                  class="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-full bg-[#14141d] hover:bg-[#FFD1B3]/10 text-[#9e9cae] hover:text-[#FFD1B3] transition cursor-pointer"
                >
                  ✕
                </button>

                <!-- Bucket Selection Option -->
                <div class="space-y-1.5">
                  <label class="text-[9px] font-bold text-[#9e9cae] uppercase tracking-wider">Bucket Destination</label>
                  <BucketGrid :buckets="activeBuckets" v-model="rule.bucket_id" :show-unassigned="true" />
                </div>

                <!-- Split Controls (Mode Switcher + Value Field) -->
                <div class="grid grid-cols-2 gap-3 items-end">
                  <!-- Mode Switcher Segmented Buttons -->
                  <div class="space-y-1">
                    <label class="text-[9px] font-bold text-[#9e9cae] uppercase tracking-wider">Rule Type</label>
                    <div class="grid grid-cols-2 p-1 bg-[#14141d] border border-[#29293a] rounded-xl">
                      <button
                        type="button"
                        @click="rule.mode = 'percentage'"
                        class="py-1.5 text-[10px] font-bold rounded-lg transition cursor-pointer"
                        :class="rule.mode === 'percentage' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
                      >
                        % Percent
                      </button>
                      <button
                        type="button"
                        @click="rule.mode = 'fixed'"
                        class="py-1.5 text-[10px] font-bold rounded-lg transition cursor-pointer"
                        :class="rule.mode === 'fixed' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
                      >
                        ₹ Fixed
                      </button>
                    </div>
                  </div>

                  <!-- Value Input Field -->
                  <div class="space-y-1">
                    <label class="text-[9px] font-bold text-[#9e9cae] uppercase tracking-wider">
                      {{ rule.mode === 'percentage' ? 'Percentage (%)' : 'Amount (₹)' }}
                    </label>
                    <div class="relative flex items-center">
                      <span v-if="rule.mode === 'fixed'" class="absolute left-3 text-xs font-bold text-[#9e9cae]">₹</span>
                      <input
                        v-model="rule.value"
                        type="text"
                        inputmode="decimal"
                        :placeholder="rule.mode === 'percentage' ? '25' : '1000.00'"
                        required
                        class="w-full px-3 py-2 bg-[#14141d] border border-[#29293a] focus:border-[#D4BFFF] rounded-xl text-xs font-bold focus:outline-none transition text-right"
                        :class="rule.mode === 'fixed' ? 'pl-6 pr-3' : 'px-3'"
                      />
                      <span v-if="rule.mode === 'percentage'" class="absolute right-3 text-xs font-bold text-[#9e9cae] pointer-events-none">%</span>
                    </div>
                  </div>
                </div>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import BucketGrid from './BucketGrid.vue';

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);

const updateOnlineStatus = () => {
  isOnline.value = typeof navigator !== 'undefined' ? navigator.onLine : true;
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
  }
});

const props = defineProps({
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
  }
});

const emit = defineEmits([
  'create-account', 
  'update-account',
  'delete-account', 
  'create-category', 
  'update-category',
  'delete-category',
  'create-bucket',
  'update-bucket',
  'delete-bucket',
  'transfer-bucket',
  'transfer-accounts',
  'reorder-buckets',
  'reorder-categories',
  'allocate-unassigned',
  'data-refresh'
]);

// Preset Emoji Grid Palette
const presetEmojis = [
  '🪣', '💵', '🛡️', '✈️', '💻', '📈', '💰', '💳',
  '🏦', '🚗', '🏠', '🎓', '💍', '🎁', '🏖️', '💎',
  '🛒', '🍔', '🏥', '👶', '🐕', '🎮', '☕', '⚡',
  '⛽', '🏋️', '👕', '🔑', '🚲', '🎬', '🪙', '🧾'
];

// Emoji Picker Overlays
const showNewEmojiPicker = ref(false);
const activeEditEmojiPickerId = ref(null);

const selectNewEmoji = (emoji) => {
  newBucket.value.icon = emoji;
  showNewEmojiPicker.value = false;
};

const selectEditEmoji = (emoji) => {
  editBucketIcon.value = emoji;
  activeEditEmojiPickerId.value = null;
};

const closeAllEmojiPickers = () => {
  showNewEmojiPicker.value = false;
  activeEditEmojiPickerId.value = null;
};

// Filters & Modals
const showArchivedBuckets = ref(false);
const showTransferModal = ref(false);
const showAccountTransferModal = ref(false);
const showPresetsModal = ref(false);
const editingPreset = ref(null);
const applyingPreset = ref(null);
const localPresets = ref([]);
const submittingPreset = ref(false);
const applyForm = ref({ total_amount: '', account_id: '', description: '' });
const accountTransferForm = ref({ from_account_id: '', to_account_id: '', bucket_id: '', amount: '', description: '' });
const submittingAccountTransfer = ref(false);

const activeBuckets = computed(() => props.buckets.filter(b => !b.is_archived));
const totalAllocated = computed(() => props.buckets.reduce(
  (sum, bucket) => sum + Math.round((Number(bucket.allocated_balance) || 0) * 100), 0
) / 100);
const netWorth = computed(() => props.accounts.reduce(
  (sum, account) => sum + Math.round((Number(account.balance) || 0) * 100), 0
) / 100);
const unassignedAmount = computed(() => Math.round((netWorth.value - totalAllocated.value) * 100) / 100);

const allocateToBucket = bucket => {
  const entered = prompt(`Allocate to "${bucket.name}". Available: ₹${formatAmount(unassignedAmount.value)}`, String(unassignedAmount.value));
  if (entered === null) return;
  const amount = Number(String(entered).replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) return alert('Enter a valid positive amount.');
  if (amount > unassignedAmount.value) return alert(`Only ₹${formatAmount(unassignedAmount.value)} is unassigned.`);
  if (confirm(`Allocate ₹${formatAmount(amount)} to "${bucket.name}" without changing account balances?`)) {
    emit('allocate-unassigned', { bucketId: bucket.id, amount });
  }
};
const displayedBuckets = computed(() => {
  if (showArchivedBuckets.value) return props.buckets;
  return activeBuckets.value;
});

// Form States
const newAccount = ref({ name: '', type: 'Checking' });
const submittingAccount = ref(false);

const newCategory = ref({ name: '', color: '#6366f1', icon: '🏷️', is_quick_select: false });
const submittingCategory = ref(false);

const newBucket = ref({ name: '', icon: '🪣', color: '#6366f1' });
const submittingBucket = ref(false);

const transferForm = ref({ from_bucket_id: '', to_bucket_id: '', amount: '', description: '' });
const submittingTransfer = ref(false);

const getBucketName = (id) => {
  if (!id) return 'Unassigned';
  return props.buckets.find(b => b.id === id)?.name || 'Unknown';
};

// Editing States
const editingAccountId = ref(null);
const editAccountName = ref('');
const editAccountType = ref('Checking');

const editingCategoryId = ref(null);
const editCategoryName = ref('');
const editCategoryColor = ref('#6366f1');
const editCategoryIcon = ref('🏷️');

const editingBucketId = ref(null);
const editBucketName = ref('');
const editBucketIcon = ref('🪣');
const editBucketColor = ref('#6366f1');
const editBucketArchived = ref(false);

// Format amounts
const formatAmount = (val) => {
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Handlers
const submitAccount = async () => {
  if (!newAccount.value.name.trim()) return;
  submittingAccount.value = true;
  try {
    emit('create-account', {
      name: newAccount.value.name.trim(),
      type: newAccount.value.type
    });
    newAccount.value.name = '';
    newAccount.value.type = 'Checking';
  } finally {
    submittingAccount.value = false;
  }
};

const submitCategory = async () => {
  if (!newCategory.value.name.trim()) return;
  submittingCategory.value = true;
  try {
    emit('create-category', {
      name: newCategory.value.name.trim(),
      color: newCategory.value.color,
      icon: newCategory.value.icon ? newCategory.value.icon.trim() : '🏷️',
      is_quick_select: newCategory.value.is_quick_select ? 1 : 0
    });
    newCategory.value.name = '';
    newCategory.value.color = '#6366f1';
    newCategory.value.icon = '🏷️';
    newCategory.value.is_quick_select = false;
  } finally {
    submittingCategory.value = false;
  }
};

const submitBucket = async () => {
  if (!newBucket.value.name.trim()) return;
  submittingBucket.value = true;
  try {
    emit('create-bucket', {
      name: newBucket.value.name.trim(),
      icon: newBucket.value.icon.trim() || '🪣',
      color: newBucket.value.color
    });
    newBucket.value.name = '';
    newBucket.value.icon = '🪣';
    newBucket.value.color = '#6366f1';
  } finally {
    submittingBucket.value = false;
    showNewEmojiPicker.value = false;
  }
};

const submitBucketTransfer = async () => {
  if (!transferForm.value.from_bucket_id || transferForm.value.to_bucket_id === '' || !transferForm.value.amount) return;
  const toId = transferForm.value.to_bucket_id;
  if (toId && transferForm.value.from_bucket_id === toId) {
    alert("Source and destination buckets must be different.");
    return;
  }
  submittingTransfer.value = true;
  try {
    emit('transfer-bucket', {
      from_bucket_id: transferForm.value.from_bucket_id,
      to_bucket_id: toId,
      amount: Number(transferForm.value.amount),
      description: transferForm.value.description.trim() || null
    });
    showTransferModal.value = false;
    transferForm.value = { from_bucket_id: '', to_bucket_id: '', amount: '', description: '' };
  } finally {
    submittingTransfer.value = false;
  }
};

const submitAccountTransfer = async () => {
  if (!accountTransferForm.value.from_account_id || !accountTransferForm.value.to_account_id || !accountTransferForm.value.amount) return;
  submittingAccountTransfer.value = true;
  try {
    emit('transfer-accounts', {
      from_account_id: accountTransferForm.value.from_account_id,
      to_account_id: accountTransferForm.value.to_account_id,
      bucket_id: accountTransferForm.value.bucket_id || null,
      amount: Number(accountTransferForm.value.amount),
      description: accountTransferForm.value.description.trim() || null
    });
    showAccountTransferModal.value = false;
    accountTransferForm.value = { from_account_id: '', to_account_id: '', bucket_id: '', amount: '', description: '' };
  } catch (err) {
    alert(err.message);
  } finally {
    submittingAccountTransfer.value = false;
  }
};

const loadPresets = async () => {
  try { localPresets.value = await api.getPresets(); } catch (e) { console.error(e); }
};

const startApplyPreset = (preset) => {
  applyingPreset.value = preset;
  applyForm.value = { total_amount: '', account_id: props.accounts[0]?.id || '', description: '' };
};

const submitApplyPreset = async () => {
  if (!applyForm.value.total_amount || !applyForm.value.account_id || !applyingPreset.value) return;
  submittingPreset.value = true;
  try {
    await api.applyPreset(applyingPreset.value.id, {
      total_amount: Number(applyForm.value.total_amount),
      account_id: applyForm.value.account_id,
      description: applyForm.value.description
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
    const rules = editingPreset.value.rules.map(r => ({ bucket_id: r.bucket_id || null, mode: r.mode, value: Number(r.value) }));
    if (editingPreset.value.id) {
      await api.updatePreset(editingPreset.value.id, { name: editingPreset.value.name, rules });
    } else {
      await api.createPreset({ name: editingPreset.value.name, rules });
    }
    await loadPresets();
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
  if (!editingPreset.value || !editingPreset.value.rules) return 0;
  return editingPreset.value.rules
    .filter(r => r.mode === 'percentage')
    .reduce((sum, r) => sum + (Number(r.value) || 0), 0);
});

const editingPresetTotalFixed = computed(() => {
  if (!editingPreset.value || !editingPreset.value.rules) return 0;
  return editingPreset.value.rules
    .filter(r => r.mode === 'fixed')
    .reduce((sum, r) => sum + (Number(r.value) || 0), 0);
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

const startEditCategory = (category) => {
  editingCategoryId.value = category.id;
  editCategoryName.value = category.name;
  editCategoryColor.value = category.color || '#6366f1';
  editCategoryIcon.value = category.icon || '🏷️';
};

const cancelEditCategory = () => {
  editingCategoryId.value = null;
};

const saveCategoryEdit = (category) => {
  const name = editCategoryName.value.trim();
  if (!name) return;
  emit('update-category', category.id, { 
    name,
    color: editCategoryColor.value,
    icon: editCategoryIcon.value ? editCategoryIcon.value.trim() : '🏷️',
    is_quick_select: category.is_quick_select ? 1 : 0
  });
  editingCategoryId.value = null;
};

const startEditBucket = (bucket) => {
  editingBucketId.value = bucket.id;
  editBucketName.value = bucket.name;
  editBucketIcon.value = bucket.icon || '🪣';
  editBucketColor.value = bucket.color || '#6366f1';
  editBucketArchived.value = bucket.is_archived || false;
  activeEditEmojiPickerId.value = null;
};

const saveBucketEdit = (bucket) => {
  const name = editBucketName.value.trim();
  if (!name) return;
  emit('update-bucket', bucket.id, {
    name,
    icon: editBucketIcon.value.trim() || '🪣',
    color: editBucketColor.value,
    is_archived: editBucketArchived.value
  });
  editingBucketId.value = null;
  activeEditEmojiPickerId.value = null;
};

const confirmDeleteAccount = (account) => {
  const confirm = window.confirm(`Are you sure you want to delete the account "${account.name}"?`);
  if (confirm) {
    emit('delete-account', account.id);
  }
};

const confirmDeleteCategory = (category) => {
  const confirm = window.confirm(`Are you sure you want to delete the category "${category.name}"?`);
  if (confirm) {
    emit('delete-category', category.id);
  }
};

const confirmDeleteBucket = (bucket) => {
  const allocation = formatAmount(bucket.allocated_balance);
  const confirm = window.confirm(`Permanently delete the bucket "${bucket.name}" and remove its ₹${allocation} allocation? Transaction history will be kept, but it will no longer reference this bucket. This cannot be undone.`);
  if (confirm) {
    emit('delete-bucket', bucket.id);
  }
};

// Data Backup & Export System
import { api } from '../services/api';

const exportUrl = computed(() => api.exportDatabaseUrl());
const backupsList = ref([]);
const creatingBackup = ref(false);

const loadBackupsList = async () => {
  try {
    backupsList.value = await api.getBackups();
  } catch (err) {
    console.error("Failed to load backups list:", err);
  }
};

onMounted(() => {
  loadBackupsList();
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

const handleDownloadBackup = async (filename) => {
  try {
    const url = await api.getBackupDownloadUrl(filename);
    if (url === '#') throw new Error('Backup file not found.');
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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

