<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-100 tracking-tight">Settings</h2>
        <p class="text-sm text-slate-400 mt-1">Manage your storage accounts, categories, and savings buckets.</p>
      </div>
      <button 
        @click="showTransferModal = true"
        class="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition duration-150 shadow-lg shadow-indigo-600/20 cursor-pointer shrink-0"
      >
        <span class="text-sm">⇄</span> Transfer Between Buckets
      </button>
    </div>

    <!-- Click Interceptor Overlay for active Emoji Pickers -->
    <div 
      v-if="showNewEmojiPicker || activeEditEmojiPickerId !== null" 
      class="fixed inset-0 z-30" 
      @click="closeAllEmojiPickers"
    ></div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- 1. Savings Buckets Management Card -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col space-y-6">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-base font-semibold text-slate-200">Savings Buckets</h3>
            <p class="text-xs text-slate-400 mt-0.5">Allocate purposes for your money</p>
          </div>
          <button 
            @click="showArchivedBuckets = !showArchivedBuckets"
            class="text-[11px] font-medium text-indigo-400 hover:underline cursor-pointer"
          >
            {{ showArchivedBuckets ? 'Hide Archived' : 'Show Archived' }}
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2.5">
          <div class="rounded-xl border border-indigo-900/50 bg-indigo-950/25 p-3">
            <p class="text-[9px] font-bold uppercase tracking-wider text-indigo-400">Total allocated</p>
            <p class="mt-1 text-sm font-bold text-indigo-200">₹{{ formatAmount(totalAllocated) }}</p>
          </div>
          <div class="rounded-xl border border-amber-900/50 bg-amber-950/25 p-3">
            <p class="text-[9px] font-bold uppercase tracking-wider text-amber-400">Unassigned</p>
            <p class="mt-1 text-sm font-bold text-amber-200">₹{{ formatAmount(unassignedAmount) }}</p>
          </div>
        </div>

        <!-- Add Bucket Form -->
        <form @submit.prevent="submitBucket" class="p-4 bg-slate-950/50 border border-slate-800/60 rounded-xl space-y-3">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Add Savings Bucket</p>
          
          <div class="space-y-2">
            <div class="flex gap-2 relative">
              <!-- Emoji Button & Input Trigger -->
              <div class="relative z-50">
                <button
                  type="button"
                  @click="showNewEmojiPicker = !showNewEmojiPicker"
                  class="w-12 h-9 flex items-center justify-center bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-xl text-lg transition cursor-pointer"
                  title="Click to pick an emoji"
                >
                  {{ newBucket.icon || '🪣' }}
                </button>

                <!-- Emoji Picker Dropdown Overlay for New Bucket -->
                <div 
                  v-if="showNewEmojiPicker" 
                  class="absolute left-0 top-11 z-50 w-64 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl space-y-2 transform transition-all"
                >
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Bucket Emoji</p>
                  <div class="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    <button
                      v-for="emoji in presetEmojis"
                      :key="emoji"
                      type="button"
                      @click="selectNewEmoji(emoji)"
                      class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-950 text-base transition cursor-pointer"
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
                placeholder="Bucket Name (e.g. Emergency Fund)"
                required
                class="flex-grow px-3.5 py-2 bg-slate-900 border border-slate-800 focus:border-indigo-500 hover:bg-slate-850 rounded-xl text-slate-100 text-xs placeholder-slate-500 focus:outline-none transition"
              />
            </div>

            <div class="flex justify-between items-center pt-1">
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-slate-400 uppercase font-semibold">Color:</span>
                <div class="relative w-7 h-7 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center shrink-0">
                  <input 
                    v-model="newBucket.color"
                    type="color"
                    class="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer bg-transparent opacity-0"
                    style="width: 150%; height: 150%; transform: translate(-20%, -20%);"
                  />
                  <div class="w-3.5 h-3.5 rounded-full border border-white/20" :style="{ backgroundColor: newBucket.color }"></div>
                </div>
              </div>

              <button 
                type="submit"
                :disabled="submittingBucket"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {{ submittingBucket ? 'Creating...' : 'Create Bucket' }}
              </button>
            </div>
          </div>
        </form>

        <!-- Bucket List -->
        <div class="flex-grow">
          <div v-if="displayedBuckets.length > 0" class="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
            <div 
              v-for="(bucket, idx) in displayedBuckets" 
              :key="bucket.id"
              class="p-3.5 hover:bg-slate-950/30 transition duration-150"
            >
              <!-- Editing Mode -->
              <div v-if="editingBucketId === bucket.id" class="space-y-3">
                <div class="flex gap-2 relative">
                  <!-- Edit Emoji Trigger -->
                  <div class="relative z-50">
                    <button
                      type="button"
                      @click="activeEditEmojiPickerId = activeEditEmojiPickerId === bucket.id ? null : bucket.id"
                      class="w-10 h-8 flex items-center justify-center bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-lg text-sm transition cursor-pointer"
                    >
                      {{ editBucketIcon || '🪣' }}
                    </button>

                    <!-- Edit Emoji Picker Overlay -->
                    <div 
                      v-if="activeEditEmojiPickerId === bucket.id" 
                      class="absolute left-0 top-10 z-50 w-64 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl space-y-2"
                    >
                      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Bucket Emoji</p>
                      <div class="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto pr-1">
                        <button
                          v-for="emoji in presetEmojis"
                          :key="emoji"
                          type="button"
                          @click="selectEditEmoji(emoji)"
                          class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-950 text-base transition cursor-pointer"
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
                    class="flex-grow px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-slate-100 text-xs focus:outline-none transition"
                  />
                  <!-- Color -->
                  <div class="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center shrink-0">
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
                  <label class="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                    <input type="checkbox" v-model="editBucketArchived" class="rounded border-slate-800 text-indigo-600 bg-slate-900" />
                    <span>Archive Bucket</span>
                  </label>

                  <div class="flex gap-2">
                    <button 
                      type="button"
                      @click="editingBucketId = null"
                      class="px-2.5 py-1 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      @click="saveBucketEdit(bucket)"
                      class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] rounded-lg transition cursor-pointer"
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
                      class="text-[10px] leading-none p-0.5 text-slate-400 hover:text-indigo-400 disabled:opacity-20 cursor-pointer"
                      title="Move Priority Up in Grid"
                    >
                      ▲
                    </button>
                    <button 
                      type="button"
                      @click="moveBucketPriority(idx, 1)"
                      :disabled="idx === displayedBuckets.length - 1"
                      class="text-[10px] leading-none p-0.5 text-slate-400 hover:text-indigo-400 disabled:opacity-20 cursor-pointer"
                      title="Move Priority Down in Grid"
                    >
                      ▼
                    </button>
                  </div>

                  <span class="text-base">{{ bucket.icon || '🪣' }}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <p class="text-xs font-semibold text-slate-200">{{ bucket.name }}</p>
                      <span v-if="bucket.is_archived" class="px-1.5 py-0.2 text-[9px] font-semibold rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">Archived</span>
                    </div>
                    <p class="text-[10px] text-slate-400 font-medium mt-0.5">
                      Allocated: <span class="text-indigo-400 font-semibold">₹{{ formatAmount(bucket.allocated_balance) }}</span>
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
                    class="text-slate-400 hover:text-indigo-400 hover:bg-indigo-950/20 p-2 rounded-lg transition cursor-pointer"
                    title="Edit Bucket"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    @click="confirmDeleteBucket(bucket)"
                    class="text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 p-2 rounded-lg transition cursor-pointer"
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
          <div v-else class="text-center py-12 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
            No savings buckets found.
          </div>
        </div>
      </div>

      <!-- 2. Account Management Card -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col space-y-6">
        <div>
          <h3 class="text-base font-semibold text-slate-200">Manage Accounts</h3>
          <p class="text-xs text-slate-400 mt-1">Create accounts (where money is stored)</p>
        </div>

        <!-- Add Account Form -->
        <form @submit.prevent="submitAccount" class="p-4 bg-slate-950/50 border border-slate-800/60 rounded-xl space-y-4">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Add New Account</p>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input 
              v-model="newAccount.name"
              type="text"
              placeholder="Account Name (e.g. SBI)"
              required
              class="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 focus:border-indigo-500 hover:bg-slate-850 rounded-xl text-slate-100 text-xs placeholder-slate-500 focus:outline-none transition"
            />
            <select 
              v-model="newAccount.type"
              class="w-full px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 focus:bg-slate-900 focus:border-indigo-500 rounded-xl text-slate-200 text-xs focus:outline-none transition cursor-pointer"
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
            class="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {{ submittingAccount ? 'Creating...' : 'Create Account' }}
          </button>
        </form>

        <!-- Account List -->
        <div class="flex-grow">
          <div v-if="accounts.length > 0" class="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
            <div 
              v-for="account in accounts" 
              :key="account.id"
              class="p-3.5 hover:bg-slate-950/30 transition duration-150"
            >
              <!-- Editing Mode -->
              <div v-if="editingAccountId === account.id" class="space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input 
                    v-model="editAccountName"
                    type="text"
                    required
                    class="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-slate-100 text-xs focus:outline-none transition"
                  />
                  <select 
                    v-model="editAccountType"
                    class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-slate-200 text-xs focus:outline-none transition cursor-pointer"
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
                    class="px-2.5 py-1 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    @click="saveAccountEdit(account)"
                    class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] rounded-lg transition cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>

              <!-- Normal Mode -->
              <div v-else class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-semibold text-slate-200">{{ account.name }}</p>
                  <p class="text-[10px] text-slate-400 mt-0.5">
                    <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">{{ account.type }}</span>
                    <span class="ml-2 font-medium text-slate-300">Balance: ₹{{ formatAmount(account.balance) }}</span>
                  </p>
                </div>
                <div class="flex gap-1.5">
                  <button 
                    @click="startEditAccount(account)"
                    class="text-slate-400 hover:text-indigo-400 hover:bg-indigo-950/20 p-2 rounded-lg transition cursor-pointer"
                    title="Edit Account"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    @click="confirmDeleteAccount(account)"
                    class="text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 p-2 rounded-lg transition cursor-pointer"
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
          <div v-else class="text-center py-12 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
            No accounts configured.
          </div>
        </div>
      </div>

      <!-- 3. Category Management Card -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col space-y-6">
        <div>
          <h3 class="text-base font-semibold text-slate-200">Manage Categories</h3>
          <p class="text-xs text-slate-400 mt-1">Create categories (for spending analytics)</p>
        </div>

        <!-- Add Category Form -->
        <form @submit.prevent="submitCategory" class="p-4 bg-slate-950/50 border border-slate-800/60 rounded-xl space-y-4">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Add New Category</p>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <input 
              v-model="newCategory.icon"
              type="text"
              placeholder="Icon (e.g. 🍔)"
              class="w-16 px-2.5 py-2 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 text-center text-sm focus:outline-none transition"
            />

            <input 
              v-model="newCategory.name"
              type="text"
              placeholder="Category Name (e.g. Subscriptions)"
              required
              class="sm:col-span-2 px-3.5 py-2 bg-slate-900 border border-slate-800 focus:border-indigo-500 hover:bg-slate-850 rounded-xl text-slate-100 text-xs placeholder-slate-500 focus:outline-none transition"
            />
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label class="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                v-model="newCategory.is_quick_select" 
                class="rounded border-slate-800 text-amber-500 focus:ring-amber-500 bg-slate-900 cursor-pointer"
              />
              <span>⭐ Pin as Quick Select in Transaction Form</span>
            </label>

            <div class="flex items-center gap-3 ml-auto">
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-slate-400 uppercase font-semibold">Color:</span>
                <div class="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center shrink-0">
                  <input 
                    v-model="newCategory.color"
                    type="color"
                    class="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer bg-transparent opacity-0"
                    style="width: 150%; height: 150%; transform: translate(-20%, -20%);"
                  />
                  <div class="w-4 h-4 rounded-full border border-white/20" :style="{ backgroundColor: newCategory.color }"></div>
                </div>
              </div>
              <button 
                type="submit"
                :disabled="submittingCategory"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {{ submittingCategory ? 'Creating...' : 'Create' }}
              </button>
            </div>
          </div>
        </form>

        <!-- Category List -->
        <div class="flex-grow">
          <div v-if="categories.length > 0" class="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
            <div 
              v-for="category in categories" 
              :key="category.id"
              class="p-3.5 hover:bg-slate-950/30 transition duration-150"
            >
              <!-- Editing Mode -->
              <div v-if="editingCategoryId === category.id" class="space-y-3">
                <div class="flex gap-2 items-center">
                  <input 
                    v-model="editCategoryIcon"
                    type="text"
                    placeholder="Icon"
                    class="w-12 px-2 py-1.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-slate-100 text-center text-xs focus:outline-none transition"
                  />
                  <input 
                    v-model="editCategoryName"
                    type="text"
                    required
                    class="flex-grow px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-slate-100 text-xs focus:outline-none transition"
                  />
                  <div class="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center shrink-0">
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
                    class="px-2.5 py-1 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    @click="saveCategoryEdit(category)"
                    class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] rounded-lg transition cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>

              <!-- Normal Mode -->
              <div v-else class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-base">{{ category.icon || '🏷️' }}</span>
                  <span class="w-3 h-3 rounded-full border border-white/10 shrink-0" :style="{ backgroundColor: category.color }"></span>
                  <p class="text-xs font-semibold text-slate-200">{{ category.name }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button 
                    @click="$emit('update-category', category.id, { name: category.name, color: category.color, icon: category.icon || '🏷️', is_quick_select: category.is_quick_select ? 0 : 1 })"
                    class="px-2 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                    :class="category.is_quick_select ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'"
                    :title="category.is_quick_select ? 'Pinned to Quick Select in transaction form' : 'Pin to Quick Select in transaction form'"
                  >
                    <span>{{ category.is_quick_select ? '⭐ Quick Select' : '☆ Pin' }}</span>
                  </button>

                  <button 
                    @click="startEditCategory(category)"
                    class="text-slate-400 hover:text-indigo-400 hover:bg-indigo-950/20 p-2 rounded-lg transition cursor-pointer"
                    title="Edit Category"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    @click="confirmDeleteCategory(category)"
                    class="text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 p-2 rounded-lg transition cursor-pointer"
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
          <div v-else class="text-center py-12 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
            No categories configured.
          </div>
        </div>
      </div>

    </div>



    <!-- 5. Data Management & Database Backups Card -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>💾</span> Data Backup & Export Controls
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">Export active database file, create local snapshots, or restore backups.</p>
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
            class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <span>{{ creatingBackup ? 'Creating...' : '📸 Create Local Snapshot' }}</span>
          </button>
        </div>
      </div>

      <!-- Local Snapshots List -->
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Local Snapshots (<code class="text-indigo-400 font-mono">backups/</code>)</p>
          <button @click="loadBackupsList" class="text-xs text-indigo-400 hover:underline cursor-pointer">Refresh List</button>
        </div>

        <div v-if="backupsList.length > 0" class="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20 max-h-48 overflow-y-auto">
          <div 
            v-for="b in backupsList" 
            :key="b.filename"
            class="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-slate-950/30 transition gap-2"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="text-base shrink-0">📦</span>
              <div class="truncate">
                <p class="text-xs font-semibold text-slate-200 font-mono truncate">{{ b.filename }}</p>
                <p class="text-[10px] text-slate-500">{{ formatSize(b.size_bytes) }}</p>
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
                class="px-2.5 py-1 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/50 font-semibold text-[10px] rounded-lg transition cursor-pointer flex items-center gap-1"
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
        <div v-else class="text-center py-6 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
          No snapshot backups saved in <code class="text-slate-400 font-mono">backups/</code> folder yet. Click "Create Local Snapshot" above to save a backup.
        </div>
      </div>
    </div>

    <!-- 5. Frequently Asked Questions (FAQ) Card -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div class="border-b border-slate-800 pb-3">
        <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
          <span>❓</span> Frequently Asked Questions & App Guide
        </h3>
        <p class="text-xs text-slate-400 mt-0.5">Quick guide on how Cash Buddy works and how to organize your finances.</p>
      </div>

      <div class="space-y-3">
        <!-- Q1: Buckets -->
        <details class="group bg-slate-950/40 border border-slate-800/80 rounded-xl overflow-hidden transition">
          <summary class="p-3.5 text-xs font-bold text-slate-200 cursor-pointer flex items-center justify-between hover:bg-slate-950/80">
            <span>🪣 What are Savings Buckets & why create them?</span>
            <span class="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div class="px-3.5 pb-3.5 text-xs text-slate-300 space-y-2 border-t border-slate-800/40 pt-2.5">
            <p><strong>Buckets represent the PURPOSE of your money (why it exists).</strong></p>
            <p class="text-slate-400">Instead of just seeing a lump sum in your bank account, Savings Buckets allow you to allocate funds for specific goals or expenses—such as an <em>Emergency Fund</em>, <em>Japan Trip</em>, <em>Rent</em>, or <em>Monthly Budget</em>.</p>
          </div>
        </details>

        <!-- Q2: Accounts -->
        <details class="group bg-slate-950/40 border border-slate-800/80 rounded-xl overflow-hidden transition">
          <summary class="p-3.5 text-xs font-bold text-slate-200 cursor-pointer flex items-center justify-between hover:bg-slate-950/80">
            <span>🏦 What are Accounts & what do they mean?</span>
            <span class="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div class="px-3.5 pb-3.5 text-xs text-slate-300 space-y-2 border-t border-slate-800/40 pt-2.5">
            <p><strong>Accounts represent the PHYSICAL STORAGE LOCATION of your money (where it lives).</strong></p>
            <p class="text-slate-400">Examples include your <em>Checking Account</em>, <em>Savings Account</em>, <em>Physical Cash</em>, or <em>Digital Wallet</em>.</p>
          </div>
        </details>

        <!-- Q3: Adding Transactions -->
        <details class="group bg-slate-950/40 border border-slate-800/80 rounded-xl overflow-hidden transition">
          <summary class="p-3.5 text-xs font-bold text-slate-200 cursor-pointer flex items-center justify-between hover:bg-slate-950/80">
            <span>➕ How do I add a transaction and link Buckets & Accounts?</span>
            <span class="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div class="px-3.5 pb-3.5 text-xs text-slate-300 space-y-2 border-t border-slate-800/40 pt-2.5">
            <p>Tap the <strong>+ Add</strong> button anywhere in the app. You'll choose:</p>
            <ul class="list-disc pl-4 space-y-1 text-slate-400">
              <li><strong>Account</strong>: The bank account or cash wallet that paid or received the money.</li>
              <li><strong>Savings Bucket</strong>: The purpose allocation that was spent from or added to.</li>
              <li><strong>Category</strong>: The category (Food, Utilities, Shopping) for spending charts.</li>
            </ul>
          </div>
        </details>

        <!-- Q4: Filtering -->
        <details class="group bg-slate-950/40 border border-slate-800/80 rounded-xl overflow-hidden transition">
          <summary class="p-3.5 text-xs font-bold text-slate-200 cursor-pointer flex items-center justify-between hover:bg-slate-950/80">
            <span>🔍 How does filtering work across the app?</span>
            <span class="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div class="px-3.5 pb-3.5 text-xs text-slate-300 space-y-2 border-t border-slate-800/40 pt-2.5">
            <p class="text-slate-400">In the <strong>History</strong> tab, you can filter by Date Range (This Month, Last Month, Custom), Transaction Type (Income/Expense), Account, Bucket, or Categories. The spending breakdown pie charts automatically update to reflect your active filter selection!</p>
          </div>
        </details>

        <!-- Q5: Export & Backup -->
        <details class="group bg-slate-950/40 border border-slate-800/80 rounded-xl overflow-hidden transition">
          <summary class="p-3.5 text-xs font-bold text-slate-200 cursor-pointer flex items-center justify-between hover:bg-slate-950/80">
            <span>💾 How do I backup or export my database?</span>
            <span class="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div class="px-3.5 pb-3.5 text-xs text-slate-300 space-y-2 border-t border-slate-800/40 pt-2.5">
            <p class="text-slate-400">Scroll up to <strong>Data Backup & Export Controls</strong> in Settings. Tap <strong>Export Active Database</strong> to download your standard <code class="text-indigo-400 font-mono">.db</code> SQLite file directly to your phone's Files app, or tap <strong>Create Local Snapshot</strong> to save a local restore point anytime.</p>
          </div>
        </details>
      </div>
    </div>

    <!-- 6. ABOUT CASH BUDDY (AT THE VERY BOTTOM) -->
    <div class="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 shadow-2xl space-y-5">
      <div class="flex items-center gap-3 border-b border-slate-800/80 pb-4">
        <img src="/cashbuddy-logo.svg?v=3" alt="Cash Buddy Logo" class="w-11 h-11 object-contain" />
        <div>
          <h3 class="text-base font-bold text-slate-100">About Cash Buddy</h3>
          <p class="text-xs text-indigo-400 font-medium">Your Personal Expense Tracker</p>
        </div>
      </div>

      <!-- Ideation & Creator Note -->
      <div class="space-y-3.5 text-xs text-slate-300 leading-relaxed">
        <div class="p-3.5 bg-indigo-950/50 border border-indigo-900/60 rounded-xl text-indigo-300 font-medium flex items-center gap-2">
          <span>✨</span>
          <span>This whole app was built and ideated by <strong>Sajid</strong>.</span>
        </div>

        <p class="text-slate-300">
          I have been tracking my finances via a notepad all this time. It was just for my own needs so I would know where my money is going, but I thought I needed an app that would make adding transactions easier.
        </p>
        <p class="text-slate-300">
          The first thing that made me think of this was how I spent so much time at the end of months manually tallying and summing everything; it took way too long and quite frankly I would have made many mistakes.
        </p>
        <p class="text-slate-300">
          This app has been on my mind for the past 4-ish years, and I’ve been making versions of it for a very long time. But this is the first time that I’ve brought it to a phone. I am still actively working on making it better.
        </p>

        <!-- On-Device Local Data Storage Guarantee -->
        <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-slate-400">
          <p class="font-bold text-slate-200 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
            <span>🔒</span> 100% Local On-Phone Storage Guarantee
          </p>
          <p class="text-slate-300 text-[11px] leading-normal">
            Cash Buddy stores all your financial data <strong>completely locally on your own phone</strong>. Every transaction, savings bucket, and custom database vault is saved directly inside your device's local internal storage memory (WebAssembly SQLite + OPFS).
          </p>
          <p class="text-slate-400 text-[11px] leading-normal">
            No user accounts, no external servers, no cloud sync, and zero tracking—your financial data never leaves your device.
          </p>
        </div>
      </div>
    </div>

    <!-- Bucket Transfer Modal -->
    <div v-if="showTransferModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-slate-100">Transfer Allocation Between Buckets</h3>
          <button @click="showTransferModal = false" class="text-slate-400 hover:text-slate-200 text-lg">✕</button>
        </div>

        <div class="p-3 bg-indigo-950/30 border border-indigo-900/40 rounded-xl text-xs text-slate-300">
          <p>This moves allocated funds from one bucket to another. Your physical <strong>bank account balances remain 100% unchanged</strong>.</p>
        </div>

        <form @submit.prevent="submitBucketTransfer" class="space-y-4">
          <!-- From Bucket -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">From Bucket *</label>
            <select 
              v-model="transferForm.from_bucket_id"
              required
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 text-xs focus:outline-none transition cursor-pointer"
            >
              <option value="" disabled>Select Source Bucket</option>
              <option v-for="b in activeBuckets" :key="b.id" :value="b.id">
                {{ b.icon || '🪣' }} {{ b.name }} (Allocated: ₹{{ formatAmount(b.allocated_balance) }})
              </option>
            </select>
          </div>

          <!-- To Bucket -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">To Bucket *</label>
            <select 
              v-model="transferForm.to_bucket_id"
              required
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 text-xs focus:outline-none transition cursor-pointer"
            >
              <option value="" disabled>Select Destination Bucket</option>
              <option v-for="b in activeBuckets" :key="b.id" :value="b.id">
                {{ b.icon || '🪣' }} {{ b.name }} (Allocated: ₹{{ formatAmount(b.allocated_balance) }})
              </option>
            </select>
          </div>

          <!-- Amount -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Amount to Move (₹) *</label>
            <input 
              v-model.number="transferForm.amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
              class="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 text-xs focus:outline-none transition"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Reason / Description (Optional)</label>
            <input 
              v-model="transferForm.description"
              type="text"
              placeholder="e.g. Reallocating trip funds to laptop"
              class="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 text-xs focus:outline-none transition"
            />
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              @click="showTransferModal = false" 
              class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              :disabled="submittingTransfer"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {{ submittingTransfer ? 'Transferring...' : 'Transfer Funds' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

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
  'reorder-buckets',
  'allocate-unassigned'
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
  if (!transferForm.value.from_bucket_id || !transferForm.value.to_bucket_id || !transferForm.value.amount) return;
  if (transferForm.value.from_bucket_id === transferForm.value.to_bucket_id) {
    alert("Source and destination buckets must be different.");
    return;
  }
  submittingTransfer.value = true;
  try {
    emit('transfer-bucket', {
      from_bucket_id: transferForm.value.from_bucket_id,
      to_bucket_id: transferForm.value.to_bucket_id,
      amount: Number(transferForm.value.amount),
      description: transferForm.value.description.trim() || null
    });
    showTransferModal.value = false;
    transferForm.value = { from_bucket_id: '', to_bucket_id: '', amount: '', description: '' };
  } finally {
    submittingTransfer.value = false;
  }
};

const moveBucketPriority = (idx, direction) => {
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= displayedBuckets.value.length) return;
  const list = [...displayedBuckets.value];
  const [moved] = list.splice(idx, 1);
  list.splice(newIdx, 0, moved);
  const ids = list.map(b => b.id);
  emit('reorder-buckets', ids);
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
