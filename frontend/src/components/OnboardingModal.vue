<template>
  <div>
    <!-- ============================================================== -->
    <!-- MODE 1: QUICK SETUP MODAL DIALOG                               -->
    <!-- ============================================================== -->
    <div v-if="isOpen && !isSpotlightTour" class="fixed inset-0 z-[100] bg-[#0c0d14]/95 backdrop-blur-xl flex items-start sm:items-center justify-center p-3 pt-[max(2.5rem,env(safe-area-inset-top))] sm:p-4 overflow-y-auto">
      <div class="relative w-full max-w-xl bg-[#0f1019] border border-[#1f202e] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[calc(100dvh-3.5rem)]">
        
        <!-- TOP HEADER BAR -->
        <div class="px-5 py-4 border-b border-[#1f202e] flex items-center justify-between bg-[#141520]/80 shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-[#D4BFFF]/10 border border-[#D4BFFF]/20 text-[#D4BFFF] flex items-center justify-center font-bold text-sm">
              <span class="material-symbols-outlined text-lg">tune</span>
            </div>
            <div>
              <h2 class="text-sm font-bold text-[#f1f0f5] leading-tight">Quick Vault Setup</h2>
              <p class="text-[10px] text-[#9e9cae] leading-tight">Step {{ setupStep }} of 4</p>
            </div>
          </div>

          <!-- SKIP SETUP BUTTON -->
          <button
            @click="skipSetup"
            type="button"
            class="px-3 py-1.5 rounded-xl bg-[#141520] hover:bg-[#1f202e] border border-[#1f202e] text-[11px] font-bold text-[#9e9cae] hover:text-[#f1f0f5] transition cursor-pointer active:scale-95"
          >
            Skip Setup
          </button>
        </div>

        <!-- MAIN SCROLLABLE CONTENT BODY -->
        <div class="p-5 sm:p-6 overflow-y-auto flex-grow space-y-5 pb-48 sm:pb-6">
          
          <!-- STEP 1: ACCOUNTS -->
          <div v-if="setupStep === 1" class="space-y-4">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#D4BFFF]">Step 1 • Accounts</span>
              <h3 class="text-lg font-bold text-[#f1f0f5] mt-0.5">What accounts do you use?</h3>
              <p class="text-xs text-[#9e9cae] mt-1">Accounts are where your money physically lives. Select the accounts you want in your new vault.</p>
            </div>

            <!-- Suggested Accounts Selection -->
            <div class="grid grid-cols-1 gap-2.5">
              <div
                v-for="(acc, idx) in accountOptions"
                :key="acc.name"
                class="p-3 rounded-2xl border transition flex flex-col gap-2"
                :class="acc.selected ? 'bg-[#D4BFFF]/10 border-[#D4BFFF] text-[#f1f0f5]' : 'bg-[#141520] border-[#1f202e] text-[#9e9cae]'"
              >
                <div @click="toggleAccountOption(idx)" class="flex items-center justify-between cursor-pointer">
                  <div class="flex items-center gap-2.5">
                    <div 
                      class="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
                      :class="acc.selected ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'bg-[#191924] text-[#9e9cae]'"
                    >
                      <span class="material-symbols-outlined text-base">{{ acc.icon }}</span>
                    </div>
                    <div>
                      <h4 class="text-xs font-bold leading-tight" :class="acc.selected ? 'text-[#f1f0f5]' : 'text-[#9e9cae]'">{{ acc.name }}</h4>
                      <p class="text-[10px] text-[#9e9cae]">{{ acc.type }}</p>
                    </div>
                  </div>

                  <div 
                    class="w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0"
                    :class="acc.selected ? 'border-[#D4BFFF] bg-[#D4BFFF] text-[#0f0f15] font-bold' : 'border-[#1f202e]'"
                  >
                    <span v-if="acc.selected">✓</span>
                  </div>
                </div>

                <!-- Seed Starting Balance Input when Selected -->
                <div v-if="acc.selected" class="pt-2 border-t border-[#1f202e]/60 flex items-center justify-between gap-3" @click.stop>
                  <label class="text-[10px] font-bold text-[#D4BFFF] uppercase tracking-wider">Starting Seed Balance:</label>
                  <div class="flex items-center gap-1 bg-[#0f1019] border border-[#1f202e] rounded-xl px-2.5 py-1 w-36">
                    <span class="text-xs font-bold text-[#9e9cae]">{{ currencySymbol }}</span>
                    <input
                      v-model="acc.seedBalance"
                      type="text"
                      inputmode="decimal"
                      placeholder="0.00"
                      class="w-full text-xs font-bold text-[#f1f0f5] tabular-nums bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Custom Account Form -->
            <div v-if="showCustomAccountForm" class="p-3.5 bg-[#141520] border border-[#1f202e] rounded-2xl space-y-3">
              <h4 class="text-xs font-bold text-[#D4BFFF]">Add Custom Account</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input 
                  v-model="customAccount.name" 
                  type="text" 
                  placeholder="Account Name (e.g. HDFC Salary)"
                  class="bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-xl px-3 py-2 text-xs text-[#f1f0f5] focus:outline-none"
                />
                <select 
                  v-model="customAccount.type"
                  class="bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-xl px-3 py-2 text-xs text-[#f1f0f5] focus:outline-none"
                >
                  <option value="Checking">Checking / Bank</option>
                  <option value="Savings">Savings</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Wallet">UPI / Digital Wallet</option>
                </select>
              </div>
              <button 
                @click="addCustomAccount" 
                type="button" 
                class="w-full py-2 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Save Account
              </button>
            </div>

            <button 
              v-else 
              @click="showCustomAccountForm = true" 
              type="button"
              class="w-full py-2.5 bg-[#141520] hover:bg-[#191924] border border-dashed border-[#1f202e] hover:border-[#D4BFFF]/50 text-xs font-bold text-[#D4BFFF] rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span class="material-symbols-outlined text-base">add</span>
              <span>Add Custom Account</span>
            </button>
          </div>

          <!-- STEP 2: CATEGORIES (WITH ADD CUSTOM CATEGORY BUTTON & FORM) -->
          <div v-else-if="setupStep === 2" class="space-y-4">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#FFD1B3]">Step 2 • Categories</span>
              <h3 class="text-lg font-bold text-[#f1f0f5] mt-0.5">What do you spend and earn money on?</h3>
              <p class="text-xs text-[#9e9cae] mt-1">Categories describe what your money is for. Customize icons and colors to suit your workflow.</p>
            </div>

            <!-- Custom Category Creation Form -->
            <div v-if="showCustomCategoryForm" class="p-4 bg-[#141520] border border-[#1f202e] rounded-2xl space-y-3.5">
              <div class="flex justify-between items-center border-b border-[#1f202e] pb-2">
                <h4 class="text-xs font-bold text-[#FFD1B3]">Add Custom Category</h4>
                <button @click="showCustomCategoryForm = false" type="button" class="text-xs text-[#9e9cae] hover:text-[#f1f0f5]">✕ Cancel</button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-[10px] font-bold text-[#9e9cae] uppercase mb-1">Category Name</label>
                  <input 
                    v-model="customCategory.name" 
                    type="text" 
                    placeholder="e.g. Pet Care, Subscriptions"
                    class="w-full bg-[#0f1019] border border-[#1f202e] focus:border-[#FFD1B3] rounded-xl px-3 py-2 text-xs text-[#f1f0f5] focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-[#9e9cae] uppercase mb-1">Type</label>
                  <select 
                    v-model="customCategory.type"
                    class="w-full bg-[#0f1019] border border-[#1f202e] focus:border-[#FFD1B3] rounded-xl px-3 py-2 text-xs text-[#f1f0f5] focus:outline-none"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <!-- Color & Icon Pickers -->
              <ColorPicker v-model="customCategory.color" label="Category Color" />
              <IconPicker v-model="customCategory.icon" />

              <button 
                @click="addCustomCategory" 
                type="button" 
                class="w-full py-2 bg-[#FFD1B3] hover:bg-[#ffbe94] text-[#0f0f15] font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Save Custom Category
              </button>
            </div>

            <button 
              v-else 
              @click="showCustomCategoryForm = true" 
              type="button"
              class="w-full py-2.5 bg-[#141520] hover:bg-[#191924] border border-dashed border-[#1f202e] hover:border-[#FFD1B3]/50 text-xs font-bold text-[#FFD1B3] rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span class="material-symbols-outlined text-base">add</span>
              <span>Add Custom Category</span>
            </button>

            <!-- Category Section Toggle (Income / Expense) -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-[#B3F5E1] uppercase tracking-wider">Income Categories</span>
                <span class="text-[10px] text-[#9e9cae]">{{ selectedCategoryCount('income') }} selected</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  v-for="(cat, idx) in incomeCategoryOptions"
                  :key="cat.name"
                  @click="toggleCategoryOption('income', idx)"
                  type="button"
                  class="p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer"
                  :class="cat.selected ? 'bg-[#141520] border-[#B3F5E1]/60 text-[#f1f0f5]' : 'bg-[#141520]/40 border-[#1f202e] text-[#9e9cae] opacity-60'"
                >
                  <div class="flex items-center gap-2 truncate">
                    <span class="material-symbols-outlined text-base shrink-0" :style="{ color: cat.color }">{{ cat.icon }}</span>
                    <span class="text-xs font-bold truncate">{{ cat.name }}</span>
                  </div>
                  <span v-if="cat.selected" class="text-[10px] text-[#B3F5E1] font-bold">✓</span>
                </button>
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-[#FFD1B3] uppercase tracking-wider">Expense Categories</span>
                <span class="text-[10px] text-[#9e9cae]">{{ selectedCategoryCount('expense') }} selected</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  v-for="(cat, idx) in expenseCategoryOptions"
                  :key="cat.name"
                  @click="toggleCategoryOption('expense', idx)"
                  type="button"
                  class="p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer"
                  :class="cat.selected ? 'bg-[#141520] border-[#FFD1B3]/60 text-[#f1f0f5]' : 'bg-[#141520]/40 border-[#1f202e] text-[#9e9cae] opacity-60'"
                >
                  <div class="flex items-center gap-2 truncate">
                    <span class="material-symbols-outlined text-base shrink-0" :style="{ color: cat.color }">{{ cat.icon }}</span>
                    <span class="text-xs font-bold truncate">{{ cat.name }}</span>
                  </div>
                  <span v-if="cat.selected" class="text-[10px] text-[#FFD1B3] font-bold">✓</span>
                </button>
              </div>
            </div>
          </div>

          <!-- STEP 3: SAVINGS BUCKETS (WITH ADD CUSTOM BUCKET BUTTON & FORM) -->
          <div v-else-if="setupStep === 3" class="space-y-4">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#D4BFFF]">Step 3 • Savings Buckets</span>
              <h3 class="text-lg font-bold text-[#f1f0f5] mt-0.5">Want to organize money into buckets?</h3>
              <p class="text-xs text-[#9e9cae] mt-1">Buckets help you set money aside for specific purposes without needing another physical bank account.</p>
            </div>

            <!-- Custom Bucket Creation Form -->
            <div v-if="showCustomBucketForm" class="p-4 bg-[#141520] border border-[#1f202e] rounded-2xl space-y-3.5">
              <div class="flex justify-between items-center border-b border-[#1f202e] pb-2">
                <h4 class="text-xs font-bold text-[#D4BFFF]">Add Custom Bucket</h4>
                <button @click="showCustomBucketForm = false" type="button" class="text-xs text-[#9e9cae] hover:text-[#f1f0f5]">✕ Cancel</button>
              </div>

              <div>
                <label class="block text-[10px] font-bold text-[#9e9cae] uppercase mb-1">Bucket Name</label>
                <input 
                  v-model="customBucket.name" 
                  type="text" 
                  placeholder="e.g. Japan Trip, New Bike, Laptop"
                  class="w-full bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-xl px-3 py-2 text-xs text-[#f1f0f5] focus:outline-none"
                />
              </div>

              <!-- Color & Icon Pickers -->
              <ColorPicker v-model="customBucket.color" label="Bucket Color" />
              <IconPicker v-model="customBucket.icon" />

              <button 
                @click="addCustomBucket" 
                type="button" 
                class="w-full py-2 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Save Custom Bucket
              </button>
            </div>

            <button 
              v-else 
              @click="showCustomBucketForm = true" 
              type="button"
              class="w-full py-2.5 bg-[#141520] hover:bg-[#191924] border border-dashed border-[#1f202e] hover:border-[#D4BFFF]/50 text-xs font-bold text-[#D4BFFF] rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span class="material-symbols-outlined text-base">add</span>
              <span>Add Custom Bucket</span>
            </button>

            <!-- TWO-COLUMN BUCKET GRID PREVIEW -->
            <div class="grid grid-cols-2 gap-2.5">
              <div
                v-for="(b, idx) in bucketOptions"
                :key="b.name"
                @click="toggleBucketOption(idx)"
                class="p-3.5 bg-[#141520] border rounded-2xl transition cursor-pointer flex flex-col justify-between space-y-2.5"
                :class="b.selected ? 'border-[#D4BFFF] shadow-md' : 'border-[#1f202e] opacity-60'"
              >
                <div class="flex items-center justify-between">
                  <div class="w-8 h-8 rounded-xl bg-[#0f1019] border border-[#1f202e] flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-base" :style="{ color: b.color }">{{ b.icon }}</span>
                  </div>
                  <span 
                    class="w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0"
                    :class="b.selected ? 'border-[#D4BFFF] bg-[#D4BFFF] text-[#0f0f15] font-bold' : 'border-[#1f202e]'"
                  >
                    <span v-if="b.selected">✓</span>
                  </span>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-[#f1f0f5] leading-tight truncate">{{ b.name }}</h4>
                  <p class="text-[10px] text-[#9e9cae] mt-0.5">{{ currencySymbol }}0.00 allocated</p>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 4: SALARY ALLOCATION -->
          <div v-else-if="setupStep === 4" class="space-y-4">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#B3F5E1]">Step 4 • Salary Allocation</span>
              <h3 class="text-lg font-bold text-[#f1f0f5] mt-0.5">Do you receive a regular salary?</h3>
              <p class="text-xs text-[#9e9cae] mt-1">Cash Buddy allows you to automatically split incoming salary into your accounts, buckets, and expense goals.</p>
            </div>

            <!-- Mental Model Visual Diagram -->
            <div class="p-4 bg-[#141520] border border-[#1f202e] rounded-2xl space-y-3">
              <span class="text-[10px] font-bold text-[#D4BFFF] uppercase tracking-wider">Salary Flow Mental Model</span>
              <div class="flex items-center justify-between text-center gap-1">
                <div class="p-2 rounded-xl bg-[#0f1019] border border-[#1f202e] flex-1">
                  <span class="material-symbols-outlined text-sm text-[#B3F5E1]">payments</span>
                  <p class="text-[10px] font-bold text-[#f1f0f5] mt-1">Salary</p>
                </div>
                <span class="text-xs text-[#9e9cae]">→</span>
                <div class="p-2 rounded-xl bg-[#0f1019] border border-[#1f202e] flex-1">
                  <span class="material-symbols-outlined text-sm text-[#D4BFFF]">account_balance_wallet</span>
                  <p class="text-[10px] font-bold text-[#f1f0f5] mt-1">Bank Pool</p>
                </div>
                <span class="text-xs text-[#9e9cae]">→</span>
                <div class="p-2 rounded-xl bg-[#0f1019] border border-[#1f202e] flex-1">
                  <span class="material-symbols-outlined text-sm text-[#FFD1B3]">account_tree</span>
                  <p class="text-[10px] font-bold text-[#f1f0f5] mt-1">Allocation</p>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <button 
                @click="hasSalary = true"
                type="button"
                class="w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer"
                :class="hasSalary ? 'bg-[#D4BFFF]/10 border-[#D4BFFF] text-[#f1f0f5]' : 'bg-[#141520] border-[#1f202e] text-[#9e9cae]'"
              >
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-xl text-[#B3F5E1]">check_circle</span>
                  <div>
                    <h4 class="text-xs font-bold">Yes, I receive a regular salary</h4>
                    <p class="text-[10px] text-[#9e9cae]">Enable salary allocation features</p>
                  </div>
                </div>
                <span v-if="hasSalary" class="text-xs font-bold text-[#D4BFFF]">Selected</span>
              </button>

              <button 
                @click="hasSalary = false"
                type="button"
                class="w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer"
                :class="!hasSalary ? 'bg-[#D4BFFF]/10 border-[#D4BFFF] text-[#f1f0f5]' : 'bg-[#141520] border-[#1f202e] text-[#9e9cae]'"
              >
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-xl text-[#9e9cae]">cancel</span>
                  <div>
                    <h4 class="text-xs font-bold">No, skip salary allocation</h4>
                    <p class="text-[10px] text-[#9e9cae]">I will log income manually</p>
                  </div>
                </div>
                <span v-if="!hasSalary" class="text-xs font-bold text-[#D4BFFF]">Selected</span>
              </button>
            </div>
          </div>

          <!-- SETUP COMPLETION SUMMARY SCREEN -->
          <div v-else-if="setupStep === 5" class="space-y-5 text-center py-2">
            <div class="w-12 h-12 rounded-full bg-[#B3F5E1]/20 border border-[#B3F5E1]/40 text-[#B3F5E1] flex items-center justify-center mx-auto text-2xl">
              <span class="material-symbols-outlined text-2xl">check</span>
            </div>
            <div>
              <h3 class="text-xl font-bold text-[#f1f0f5]">You're all set!</h3>
              <p class="text-xs text-[#9e9cae] mt-1">Your new vault environment has been configured.</p>
            </div>

            <!-- Summary Chips -->
            <div class="p-4 bg-[#141520] border border-[#1f202e] rounded-2xl flex items-center justify-around">
              <div>
                <span class="block text-lg font-bold text-[#D4BFFF]">{{ createdAccountsCount }}</span>
                <span class="text-[10px] font-medium text-[#9e9cae]">Accounts</span>
              </div>
              <div class="h-6 w-px bg-[#1f202e]"></div>
              <div>
                <span class="block text-lg font-bold text-[#FFD1B3]">{{ createdCategoriesCount }}</span>
                <span class="text-[10px] font-medium text-[#9e9cae]">Categories</span>
              </div>
              <div class="h-6 w-px bg-[#1f202e]"></div>
              <div>
                <span class="block text-lg font-bold text-[#B3F5E1]">{{ createdBucketsCount }}</span>
                <span class="text-[10px] font-medium text-[#9e9cae]">Buckets</span>
              </div>
            </div>

            <p class="text-[11px] text-[#9e9cae]">Everything can be customized later in Settings.</p>
          </div>
        </div>

        <!-- BOTTOM ACTION FOOTER BAR -->
        <div class="px-5 py-4 border-t border-[#1f202e] bg-[#141520]/80 shrink-0 flex items-center justify-between">
          <button
            v-if="setupStep > 1 && setupStep < 5"
            @click="setupStep--"
            type="button"
            class="px-4 py-2 rounded-xl bg-[#141520] hover:bg-[#1f202e] border border-[#1f202e] text-xs font-bold text-[#f1f0f5] transition cursor-pointer active:scale-95"
          >
            Back
          </button>
          <div v-else></div>

          <button
            @click="goNextSetup"
            type="button"
            class="px-5 py-2.5 rounded-xl bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs transition cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5"
          >
            <span>{{ setupStep === 4 ? 'Finish Setup' : (setupStep === 5 ? 'Take Interactive Tour' : 'Continue') }}</span>
            <span class="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>

      </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODE 2: INTERACTIVE SPOTLIGHT OVERLAY TOUR                     -->
    <!-- ============================================================== -->
    <div 
      v-if="isOpen && isSpotlightTour" 
      class="fixed inset-0 z-[120] pointer-events-auto overflow-hidden touch-none"
      @touchmove.prevent
    >
      <!-- Crystal-Clear Highlight Spotlight Cutout Box (0% opacity inside, 85% opacity outer box shadow) -->
      <div
        v-if="spotlightRect"
        class="fixed rounded-2xl border-2 border-[#D4BFFF] shadow-[0_0_0_9999px_rgba(12,13,20,0.85),0_0_30px_rgba(212,191,255,0.6)] pointer-events-none transition-all duration-300 ease-out z-[125]"
        :style="{
          top: spotlightRect.top + 'px',
          left: spotlightRect.left + 'px',
          width: spotlightRect.width + 'px',
          height: spotlightRect.height + 'px'
        }"
      ></div>

      <!-- Floating Tooltip Card -->
      <div
        class="fixed z-[130] w-full max-w-sm px-4 transition-all duration-300"
        :style="tooltipStyle"
      >
        <div class="bg-[#0f1019] border border-[#D4BFFF]/50 rounded-3xl p-5 shadow-2xl space-y-4">
          <!-- Step Counter & Skip Tour -->
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-[#D4BFFF] uppercase tracking-wider">
              Tour Step {{ spotlightIndex + 1 }} of {{ SPOTLIGHT_STEPS.length }}
            </span>
            <button 
              @click="finishTour" 
              type="button" 
              class="text-[11px] font-bold text-[#9e9cae] hover:text-[#f1f0f5] transition cursor-pointer px-2 py-0.5 rounded-lg hover:bg-[#141520]"
            >
              Skip Tour
            </button>
          </div>

          <!-- Step Title & Description -->
          <div class="space-y-1.5">
            <h3 class="text-base font-bold text-[#f1f0f5] flex items-center gap-2">
              <span class="material-symbols-outlined text-lg text-[#D4BFFF]">{{ currentSpotlightStep.icon }}</span>
              <span>{{ currentSpotlightStep.title }}</span>
            </h3>
            <p class="text-xs text-[#9e9cae] leading-relaxed">
              {{ currentSpotlightStep.description }}
            </p>
          </div>

          <!-- Navigation Footer Buttons -->
          <div class="flex items-center justify-between pt-2 border-t border-[#1f202e]">
            <button
              v-if="spotlightIndex > 0"
              @click="prevSpotlightStep"
              type="button"
              class="px-3.5 py-1.5 rounded-xl bg-[#141520] hover:bg-[#1f202e] border border-[#1f202e] text-xs font-bold text-[#f1f0f5] transition cursor-pointer"
            >
              Back
            </button>
            <div v-else></div>

            <button
              @click="nextSpotlightStep"
              type="button"
              class="px-4 py-2 rounded-xl bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs transition cursor-pointer active:scale-95 flex items-center gap-1 shadow-md"
            >
              <span>{{ spotlightIndex < SPOTLIGHT_STEPS.length - 1 ? 'Next' : 'Got It!' }}</span>
              <span class="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
import { api } from '../services/api.js';
import IconPicker from './IconPicker.vue';
import ColorPicker from './ColorPicker.vue';
import { currencySymbol } from '../utils/currency.js';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  initialStage: {
    type: String,
    default: 'setup' // 'setup' or 'tutorial'
  }
});

const emit = defineEmits(['close', 'completed', 'switch-tab', 'open-form-step-1', 'open-form-step-2', 'close-form']);

// Setup vs Spotlight Tour State
const isSpotlightTour = ref(props.initialStage === 'tutorial');
const setupStep = ref(1);

watch(() => props.initialStage, (val) => {
  isSpotlightTour.value = val === 'tutorial';
  if (val === 'tutorial') startSpotlightTour();
});

watch(() => props.isOpen, (val) => {
  if (val && isSpotlightTour.value) startSpotlightTour();
});

// Lock / Unlock Screen Scroll During Interactive Tour
watch(isSpotlightTour, (val) => {
  if (val) {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  } else {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }
}, { immediate: true });

// Setup Selection Options
const accountOptions = ref([
  { name: 'Cash', type: 'Cash', icon: 'payments', selected: true },
  { name: 'Bank Account', type: 'Checking', icon: 'account_balance', selected: true },
  { name: 'Savings Account', type: 'Savings', icon: 'savings', selected: true },
  { name: 'Credit Card', type: 'Credit Card', icon: 'credit_card', selected: false },
  { name: 'UPI / Wallet', type: 'Wallet', icon: 'account_balance_wallet', selected: false }
]);

const showCustomAccountForm = ref(false);
const customAccount = ref({ name: '', type: 'Checking' });

const incomeCategoryOptions = ref([
  { name: 'Salary', icon: 'payments', color: '#10b981', selected: true },
  { name: 'Freelance', icon: 'work', color: '#06b6d4', selected: true },
  { name: 'Business', icon: 'store', color: '#8b5cf6', selected: false },
  { name: 'Other Income', icon: 'account_balance_wallet', color: '#f59e0b', selected: true }
]);

const expenseCategoryOptions = ref([
  { name: 'Food & Dining', icon: 'restaurant', color: '#ef4444', selected: true },
  { name: 'Groceries', icon: 'shopping_cart', color: '#10b981', selected: true },
  { name: 'Transport', icon: 'directions_car', color: '#06b6d4', selected: true },
  { name: 'Shopping', icon: 'shopping_bag', color: '#8b5cf6', selected: true },
  { name: 'Bills & Utilities', icon: 'bolt', color: '#f59e0b', selected: true },
  { name: 'Entertainment', icon: 'movie', color: '#ec4899', selected: true },
  { name: 'Health', icon: 'medical_services', color: '#e11d48', selected: false },
  { name: 'Education', icon: 'school', color: '#3b82f6', selected: false }
]);

const showCustomCategoryForm = ref(false);
const customCategory = ref({ name: '', type: 'expense', icon: 'category', color: '#D4BFFF' });

const bucketOptions = ref([
  { name: 'Emergency Fund', icon: 'shield', color: '#3b82f6', selected: true },
  { name: 'Travel Goal', icon: 'flight', color: '#06b6d4', selected: false },
  { name: 'Monthly Bills', icon: 'receipt_long', color: '#f59e0b', selected: true },
  { name: 'General Savings', icon: 'savings', color: '#10b981', selected: true }
]);

const showCustomBucketForm = ref(false);
const customBucket = ref({ name: '', icon: 'savings', color: '#D4BFFF' });

function addCustomBucket() {
  if (!customBucket.value.name.trim()) return;
  bucketOptions.value.push({
    name: customBucket.value.name.trim(),
    icon: customBucket.value.icon || 'savings',
    color: customBucket.value.color || '#D4BFFF',
    selected: true
  });
  customBucket.value = { name: '', icon: 'savings', color: '#D4BFFF' };
  showCustomBucketForm.value = false;
}

const hasSalary = ref(true);

const createdAccountsCount = computed(() => accountOptions.value.filter(a => a.selected).length);
const createdCategoriesCount = computed(() => incomeCategoryOptions.value.filter(c => c.selected).length + expenseCategoryOptions.value.filter(c => c.selected).length);
const createdBucketsCount = computed(() => bucketOptions.value.filter(b => b.selected).length);

function toggleAccountOption(idx) {
  accountOptions.value[idx].selected = !accountOptions.value[idx].selected;
}

function addCustomAccount() {
  if (!customAccount.value.name.trim()) return;
  accountOptions.value.push({
    name: customAccount.value.name.trim(),
    type: customAccount.value.type,
    icon: 'account_balance',
    selected: true
  });
  customAccount.value.name = '';
  showCustomAccountForm.value = false;
}

function toggleCategoryOption(type, idx) {
  if (type === 'income') {
    incomeCategoryOptions.value[idx].selected = !incomeCategoryOptions.value[idx].selected;
  } else {
    expenseCategoryOptions.value[idx].selected = !expenseCategoryOptions.value[idx].selected;
  }
}

function addCustomCategory() {
  if (!customCategory.value.name.trim()) return;
  const newCat = {
    name: customCategory.value.name.trim(),
    icon: customCategory.value.icon || 'category',
    color: customCategory.value.color || '#D4BFFF',
    selected: true
  };
  if (customCategory.value.type === 'income') {
    incomeCategoryOptions.value.push(newCat);
  } else {
    expenseCategoryOptions.value.push(newCat);
  }
  customCategory.value = { name: '', type: 'expense', icon: 'category', color: '#D4BFFF' };
  showCustomCategoryForm.value = false;
}

function selectedCategoryCount(type) {
  const arr = type === 'income' ? incomeCategoryOptions.value : expenseCategoryOptions.value;
  return arr.filter(c => c.selected).length;
}

function toggleBucketOption(idx) {
  bucketOptions.value[idx].selected = !bucketOptions.value[idx].selected;
}

async function applyQuickSetup() {
  try {
    const existingAccounts = (await api.getAccounts()).map(a => a.name.toLowerCase());
    const existingCategories = (await api.getCategories()).map(c => c.name.toLowerCase());
    const existingBuckets = (await api.getBuckets()).map(b => b.name.toLowerCase());

    // 1. Accounts
    for (const acc of accountOptions.value.filter(a => a.selected)) {
      if (!existingAccounts.includes(acc.name.toLowerCase())) {
        const seed = parseFloat(String(acc.seedBalance || '0').replace(',', '.')) || 0.0;
        await api.createAccount({ name: acc.name, type: acc.type, balance: seed });
      }
    }
    // 2. Income Categories
    for (const cat of incomeCategoryOptions.value.filter(c => c.selected)) {
      if (!existingCategories.includes(cat.name.toLowerCase())) {
        await api.createCategory({ name: cat.name, color: cat.color, icon: cat.icon });
      }
    }
    // 3. Expense Categories
    for (const cat of expenseCategoryOptions.value.filter(c => c.selected)) {
      if (!existingCategories.includes(cat.name.toLowerCase())) {
        await api.createCategory({ name: cat.name, color: cat.color, icon: cat.icon });
      }
    }
    // 4. Buckets
    for (const b of bucketOptions.value.filter(b => b.selected)) {
      if (!existingBuckets.includes(b.name.toLowerCase())) {
        await api.createBucket({ name: b.name, icon: b.icon, color: b.color });
      }
    }
    await api.setOnboardingState({ setupComplete: true });
    emit('completed');
  } catch (err) {
    console.error('Error saving onboarding quick setup:', err);
  }
}

async function goNextSetup() {
  if (setupStep.value < 4) {
    setupStep.value++;
  } else if (setupStep.value === 4) {
    await applyQuickSetup();
    setupStep.value = 5;
  } else if (setupStep.value === 5) {
    startSpotlightTour();
  }
}

async function skipSetup() {
  await applyQuickSetup();
  await api.setOnboardingState({ setupComplete: true, tutorialComplete: true });
  emit('completed');
  emit('close');
}

// =====================================================================
// INTERACTIVE SPOTLIGHT TOUR LOGIC
// =====================================================================

const SPOTLIGHT_STEPS = [
  {
    target: 'vault-switcher',
    tab: 'dashboard',
    title: 'Vault Switcher',
    icon: 'folder_zip',
    description: 'Switch between isolated financial workspaces (e.g. Personal vs Business) anytime from here. Each vault maintains its own private database.'
  },
  {
    target: 'dashboard-summary',
    tab: 'dashboard',
    title: 'Financial Overview',
    icon: 'dashboard',
    description: 'Displays your Net Worth across all bank accounts and wallets, along with real-time monthly Income and Expense totals.'
  },
  {
    target: 'accounts-grid',
    tab: 'dashboard',
    title: 'Storage Accounts',
    icon: 'account_balance',
    description: 'Accounts represent where your money physically lives. Balances update automatically when money enters, leaves, or transfers.'
  },
  {
    target: 'buckets-grid',
    tab: 'dashboard',
    title: 'Savings Allocations (Buckets)',
    icon: 'savings',
    description: 'Buckets organize money for specific goals (Emergency Fund, Travel) inside your existing accounts without needing extra bank accounts.'
  },
  {
    target: 'add-tx-btn-mobile',
    altTarget: 'add-tx-btn',
    tab: 'dashboard',
    title: 'Quick Add Transaction',
    icon: 'add',
    description: 'Tap the central "+" button anytime to open the transaction recorder modal.'
  },
  {
    target: 'transaction-form',
    tab: 'dashboard',
    openFormStep: 1,
    title: 'Logging a Transaction (Step 1: Bucket & Account)',
    icon: 'post_add',
    description: 'First, select your Savings Bucket and Bank Account. Note: choosing a goal bucket strictly requires selecting a real bank account, and vice versa!'
  },
  {
    target: 'transaction-form',
    tab: 'dashboard',
    openFormStep: 2,
    title: 'Logging a Transaction (Step 2: Category, Amount & Date)',
    icon: 'payments',
    description: 'Next, select the Category, enter the Amount and Date, and optional notes. Tap Save to record with color-coded toast feedback!'
  },
  {
    target: 'history-filters',
    tab: 'transactions',
    closeForm: true,
    title: 'History & Sleek Filtering',
    icon: 'receipt_long',
    description: 'View your complete ledger grouped by date. Use the sleek month/year grid matrix, date filters, or search bar to find any record.'
  },
  {
    target: 'debt-list',
    tab: 'debts',
    title: 'Debt & Settlement Tracker',
    icon: 'handshake',
    description: 'Track money lent or borrowed, record partial/full settlements directly to your accounts, and get purple toast feedback on settlement.'
  },
  {
    target: 'categories-tile',
    altTarget: 'buckets-tile',
    tab: 'settings',
    title: 'More Directory Grid (Categories & Buckets)',
    icon: 'category',
    description: 'Browse the 2-column hairline grid under More. Manage accounts, goal buckets, categories, icons, and colors anytime.'
  },
  {
    target: 'backup-tile',
    tab: 'settings',
    title: 'Local Backups & Export',
    icon: 'database',
    description: 'Create encrypted local database backups, export snapshots, and manage app preferences securely.'
  },
  {
    target: null,
    tab: 'dashboard',
    title: 'Thank You for Using Cash Buddy!',
    icon: 'favorite',
    description: 'Thank you for using Cash Buddy! Please note that Cash Buddy is an active work in progress—new features, optimizations, and enhancements are constantly being made to improve your experience.'
  }
];

const spotlightIndex = ref(0);
const spotlightRect = ref(null);
const tooltipStyle = ref({});

const currentSpotlightStep = computed(() => SPOTLIGHT_STEPS[spotlightIndex.value] || SPOTLIGHT_STEPS[0]);

function startSpotlightTour() {
  isSpotlightTour.value = true;
  spotlightIndex.value = 0;
  updateSpotlightStep();
}

function updateSpotlightStep() {
  const step = currentSpotlightStep.value;

  if (step.openFormStep === 1) {
    emit('open-form-step-1');
  } else if (step.openFormStep === 2) {
    emit('open-form-step-2');
  } else if (step.closeForm) {
    emit('close-form');
  }

  if (step.tab) emit('switch-tab', step.tab);

  nextTick(() => {
    setTimeout(() => {
      let el = step.target ? (document.querySelector(`[data-tour="${step.target}"]`) || document.querySelector(`[data-tour-target="${step.target}"]`)) : null;
      if (!el && step.altTarget) {
        el = document.querySelector(`[data-tour="${step.altTarget}"]`) || document.querySelector(`[data-tour-target="${step.altTarget}"]`);
      }

      if (el && step.target) {
        const rect = el.getBoundingClientRect();
        spotlightRect.value = {
          top: Math.max(8, rect.top - 6),
          left: Math.max(8, rect.left - 6),
          width: rect.width + 12,
          height: rect.height + 12
        };

        // Smart position tooltip below, above, or anchored to safe edges
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        if (spaceBelow >= 240) {
          tooltipStyle.value = { 
            top: (rect.bottom + 14) + 'px', 
            left: '50%', 
            transform: 'translateX(-50%)' 
          };
        } else if (spaceAbove >= 240) {
          tooltipStyle.value = { 
            top: Math.max(54, rect.top - 210) + 'px', 
            left: '50%', 
            transform: 'translateX(-50%)' 
          };
        } else {
          tooltipStyle.value = { 
            bottom: 'max(24px, env(safe-area-inset-bottom))', 
            left: '50%', 
            transform: 'translateX(-50%)' 
          };
        }
      } else {
        // Fallback center position for Thank You step with NO highlight cutout box
        spotlightRect.value = null;
        tooltipStyle.value = { 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)' 
        };
      }
    }, 180);
  });
}

function prevSpotlightStep() {
  if (spotlightIndex.value > 0) {
    spotlightIndex.value--;
    updateSpotlightStep();
  }
}

function nextSpotlightStep() {
  if (spotlightIndex.value < SPOTLIGHT_STEPS.length - 1) {
    spotlightIndex.value++;
    updateSpotlightStep();
  } else {
    finishTour();
  }
}

async function finishTour() {
  await api.setOnboardingState({ setupComplete: true, tutorialComplete: true });
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  isSpotlightTour.value = false;
  emit('close-form');
  emit('switch-tab', 'dashboard');
  emit('completed');
  emit('close');
}

onUnmounted(() => {
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  spotlightRect.value = null;
});
</script>
