<template>
  <div class="space-y-6">
    <!-- Header -->
    <div data-tour="debt-list" class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#1f202e] pb-3 animate-cascade-1">
      <div>
        <h2 class="text-lg font-bold text-[#f1f0f5] tracking-tight">Debt Tracker</h2>
        <p class="text-xs text-[#9e9cae]">Track money lent to people and money borrowed from others</p>
      </div>
      <button 
        @click="openAddModal"
        class="flex items-center gap-1.5 px-4 py-2 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs rounded-xl transition shadow-sm cursor-pointer shrink-0 min-h-[38px]"
      >
        <span class="material-symbols-outlined text-base leading-none">add</span>
        <span>Record Debt</span>
      </button>
    </div>

    <!-- Summary Metrics Section (Flush, Hairline Dividers) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-[#1f202e] animate-cascade-2">
      <!-- Owed to You -->
      <div>
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold uppercase tracking-wider text-[#B3F5E1]">Owed To You</span>
          <span class="material-symbols-outlined text-base text-[#B3F5E1]">south_west</span>
        </div>
        <p class="mt-1 text-2xl font-bold text-[#f1f0f5] tabular-nums tracking-tight">
          ₹{{ formatAmount(totalOwedToYou) }}
        </p>
        <p class="mt-0.5 text-[10px] text-[#9e9cae]">Money lent to others (Unsettled)</p>
      </div>

      <!-- You Owe -->
      <div>
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold uppercase tracking-wider text-[#FFD1B3]">You Owe</span>
          <span class="material-symbols-outlined text-base text-[#FFD1B3]">north_east</span>
        </div>
        <p class="mt-1 text-2xl font-bold text-[#f1f0f5] tabular-nums tracking-tight">
          ₹{{ formatAmount(totalYouOwe) }}
        </p>
        <p class="mt-0.5 text-[10px] text-[#9e9cae]">Money borrowed from others (Unsettled)</p>
      </div>

      <!-- Net Position -->
      <div>
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold uppercase tracking-wider text-[#D4BFFF]">Net Position</span>
        </div>
        <p class="mt-1 text-2xl font-bold tabular-nums tracking-tight" :class="netPosition >= 0 ? 'text-[#B3F5E1]' : 'text-[#FFD1B3]'">
          ₹{{ formatAmount(netPosition) }}
        </p>
        <p class="mt-0.5 text-[10px] text-[#9e9cae]">
          {{ netPosition >= 0 ? 'Net surplus' : 'Net liability' }}
        </p>
      </div>
    </div>

    <!-- Debt Controls & Hairline List -->
    <div class="space-y-3 animate-cascade-3">
      <div class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5">
        <!-- Tabs -->
        <div class="flex gap-1 bg-[#0f1019] p-1 rounded-xl border border-[#1f202e]">
          <button 
            @click="activeTab = 'active'"
            class="px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer"
            :class="activeTab === 'active' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
          >
            Active
          </button>
          <button 
            @click="activeTab = 'settled'"
            class="px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer"
            :class="activeTab === 'settled' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
          >
            Settled
          </button>
          <button 
            @click="activeTab = 'all'"
            class="px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer"
            :class="activeTab === 'all' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
          >
            All
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative flex-grow sm:max-w-xs">
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Search person or notes..."
            class="w-full pl-8 pr-3 py-1.5 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs placeholder-[#9e9cae] focus:outline-none transition"
          />
          <span class="material-symbols-outlined text-xs absolute left-2.5 top-2 text-[#9e9cae]">search</span>
        </div>
      </div>

      <!-- Hairline Divided Debt Rows -->
      <div v-if="filteredDebts.length > 0" class="border-y border-[#1f202e] divide-y divide-[#1f202e]">
        <button
          v-for="debt in filteredDebts"
          :key="debt.id"
          @click="openDetailModal(debt)"
          class="w-full flex items-center gap-3 py-3 px-1 hover:bg-[#141520] transition text-left cursor-pointer active:bg-[#141520] min-h-[48px]"
        >
          <!-- Type Icon Badge -->
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
            :class="debt.type === 'lent' ? 'bg-[#B3F5E1]/15 text-[#B3F5E1] border-[#B3F5E1]/30' : 'bg-[#FFD1B3]/15 text-[#FFD1B3] border-[#FFD1B3]/30'"
          >
            <span class="material-symbols-outlined text-base leading-none">{{ debt.type === 'lent' ? 'south_west' : 'north_east' }}</span>
          </div>

          <!-- Person Name & Meta -->
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold text-[#f1f0f5] truncate">{{ debt.person_name }}</p>
            <p class="text-[10px] text-[#9e9cae] truncate mt-0.5">
              {{ getAccountName(debt.account_id) }} • {{ formatDate(debt.created_at) }}
            </p>
          </div>

          <!-- Description snippet -->
          <span v-if="debt.description" class="hidden sm:inline text-[10px] text-[#9e9cae] truncate max-w-[120px]">{{ debt.description }}</span>

          <!-- Status dot -->
          <span
            class="w-1.5 h-1.5 rounded-full shrink-0"
            :class="debt.is_settled ? 'bg-[#1f202e]' : 'bg-[#D4BFFF]'"
          ></span>

          <!-- Amount -->
          <span
            class="text-xs font-bold tabular-nums shrink-0"
            :class="debt.type === 'lent' ? 'text-[#B3F5E1]' : 'text-[#FFD1B3]'"
          >₹{{ formatAmount(debt.amount) }}</span>
        </button>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-8 border-y border-[#1f202e] text-xs text-[#9e9cae] space-y-1">
        <p class="text-xs text-[#f1f0f5] font-semibold">No debts found matching your filters.</p>
        <p class="text-[11px]">Tap "Record Debt" above to log a debt entry.</p>
      </div>
    </div>

    <!-- Add Debt Modal Sheet -->
    <Transition name="modal">
      <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 safe-area-modal-pt sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto" @click.self="showAddModal = false">
        <div class="relative w-full max-w-md bg-[#0c0d14] border border-[#1f202e] rounded-2xl shadow-2xl overflow-hidden transform transition-all max-h-[calc(100dvh-1rem)] flex flex-col my-auto">
          
          <!-- Header -->
          <div class="px-5 py-3.5 border-b border-[#1f202e] flex justify-between items-center bg-[#0c0d14] shrink-0">
            <div>
              <h3 class="text-base font-bold text-[#D4BFFF] tracking-tight">Record New Debt</h3>
              <p class="text-[11px] text-[#9e9cae]">Track money lent or borrowed</p>
            </div>
            <button @click="showAddModal = false" class="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#9e9cae] hover:text-[#f1f0f5] cursor-pointer">
              <span class="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <form @submit.prevent="submitAddDebt" class="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain pb-48 sm:pb-6">
            <!-- Person Name -->
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">Person Name *</label>
              <input 
                v-model="newDebt.person_name"
                type="text"
                placeholder="e.g. John Doe"
                required
                @focus="$event.target.scrollIntoView({ behavior: 'smooth', block: 'center' })"
                class="w-full px-3 py-2 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs placeholder-[#9e9cae] focus:outline-none transition"
              />
            </div>

            <!-- Debt Type Switcher -->
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">Debt Type *</label>
              <div class="grid grid-cols-2 gap-2 p-1 bg-[#0f1019] rounded-xl border border-[#1f202e]">
                <button 
                  type="button"
                  @click="newDebt.type = 'lent'"
                  class="py-2 text-xs font-bold rounded-lg transition cursor-pointer flex flex-col items-center justify-center"
                  :class="newDebt.type === 'lent' ? 'bg-[#10b981] text-white shadow-sm' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
                >
                  <span>Lent Money</span>
                  <span class="text-[9px] font-normal opacity-80">(Deducts from account)</span>
                </button>
                <button 
                  type="button"
                  @click="newDebt.type = 'borrowed'"
                  class="py-2 text-xs font-bold rounded-lg transition cursor-pointer flex flex-col items-center justify-center"
                  :class="newDebt.type === 'borrowed' ? 'bg-[#ef4444] text-white shadow-sm' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
                >
                  <span>Borrowed Money</span>
                  <span class="text-[9px] font-normal opacity-80">(Adds to account)</span>
                </button>
              </div>
            </div>

            <!-- Amount Input -->
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">AMOUNT *</label>
              <div class="flex items-center gap-1 border-b border-[#1f202e] focus-within:border-[#D4BFFF] pb-1">
                <span class="text-base font-bold text-[#9e9cae]">₹</span>
                <input 
                  v-model="newDebt.amount"
                  type="text"
                  inputmode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  autocomplete="off"
                  placeholder="0.00"
                  required
                  @focus="$event.target.scrollIntoView({ behavior: 'smooth', block: 'center' })"
                  class="w-full text-base sm:text-lg font-bold text-[#f1f0f5] tabular-nums bg-transparent focus:outline-none transition"
                />
              </div>
            </div>

            <!-- Account Selection (2-Column Mobile Grid) -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">ACCOUNT *</label>
              <AccountGrid :accounts="accounts" v-model="newDebt.account_id" />
            </div>

            <!-- Savings Bucket Selection -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">SAVINGS BUCKET *</label>
              <BucketGrid :buckets="activeBuckets" v-model="newDebt.bucket_id" />
            </div>

            <!-- Notes / Description -->
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">NOTES / REASON (OPTIONAL)</label>
              <input 
                v-model="newDebt.description"
                type="text"
                placeholder="e.g. Dinner split, Emergency cash"
                @focus="$event.target.scrollIntoView({ behavior: 'smooth', block: 'center' })"
                class="w-full px-3 py-2 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs placeholder-[#9e9cae] focus:outline-none transition"
              />
            </div>

            <!-- Action CTA -->
            <div class="pt-2 border-t border-[#1f202e]">
              <button 
                type="submit" 
                :disabled="submitting"
                class="w-full py-3 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span v-if="submitting" class="w-4 h-4 border-2 border-[#0f0f15] border-t-transparent rounded-full animate-spin"></span>
                <span v-else class="material-symbols-outlined text-base">check</span>
                <span>{{ submitting ? 'Saving Debt...' : 'Save Debt' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Settle Debt Modal -->
    <Transition name="modal">
      <div v-if="showSettleModal" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0c0d14]/95 backdrop-blur-md" @click.self="showSettleModal = false">
        <div class="relative w-full max-w-md bg-[#0c0d14] border-t sm:border border-[#1f202e] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] pb-6 sm:pb-0">
          
          <!-- Header -->
          <div class="px-5 py-3.5 border-b border-[#1f202e] flex justify-between items-center bg-[#0c0d14] shrink-0">
            <h3 class="text-base font-bold text-[#D4BFFF] tracking-tight">Settle Debt</h3>
            <button @click="showSettleModal = false" class="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#9e9cae] hover:text-[#f1f0f5] cursor-pointer">
              <span class="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <div class="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
            <div v-if="settlingDebt" class="p-3.5 bg-[#0f1019] border border-[#1f202e] rounded-xl space-y-1">
              <p class="text-xs text-[#9e9cae]">Settling debt with <strong class="text-[#f1f0f5]">{{ settlingDebt.person_name }}</strong></p>
              <p class="text-xl font-bold text-[#B3F5E1] tabular-nums">₹{{ formatAmount(settlingDebt.amount) }}</p>
              <p class="text-[11px] text-[#9e9cae] leading-tight">
                {{ settlingDebt.type === 'lent' ? 'Repayment received from person → Deposits into selected account' : 'Repaid money back to person → Deducts from selected account' }}
              </p>
            </div>

            <form @submit.prevent="submitSettleDebt" class="space-y-4">
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">Target Account *</label>
                <AccountGrid :accounts="accounts" v-model="settleAccountId" />
              </div>

              <div class="pt-2 border-t border-[#1f202e]">
                <button 
                  type="submit" 
                  :disabled="submitting"
                  class="w-full py-3 bg-[#B3F5E1] hover:bg-[#86efac] text-[#0f0f15] font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span v-if="submitting" class="w-4 h-4 border-2 border-[#0f0f15] border-t-transparent rounded-full animate-spin"></span>
                  <span v-else class="material-symbols-outlined text-base">check</span>
                  <span>{{ submitting ? 'Settling...' : 'Confirm Settlement' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Debt Detail Modal -->
    <Transition name="modal-fade">
      <div v-if="selectedDebt" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0c0d14]/95 backdrop-blur-md" @click.self="selectedDebt = null">
        <div class="relative w-full sm:max-w-sm bg-[#0c0d14] border-t sm:border border-[#1f202e] sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden pb-6 sm:pb-0">

          <!-- Header -->
          <div class="px-5 pt-4 pb-3 flex items-start justify-between border-b border-[#1f202e]">
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                :class="selectedDebt.type === 'lent' ? 'bg-[#B3F5E1]/20 text-[#B3F5E1] border border-[#B3F5E1]/30' : 'bg-[#FFD1B3]/20 text-[#FFD1B3] border border-[#FFD1B3]/30'"
              >{{ selectedDebt.type === 'lent' ? '↗' : '↘' }}</div>
              <div>
                <p class="text-sm font-black text-[#f1f0f5]">{{ selectedDebt.person_name }}</p>
                <p class="text-[10px] text-[#9e9cae] mt-0.5">{{ selectedDebt.type === 'lent' ? 'Lent · Owed to you' : 'Borrowed · You owe' }}</p>
              </div>
            </div>
            <button @click="selectedDebt = null" class="text-[#9e9cae] hover:text-[#f1f0f5] p-1 cursor-pointer transition">✕</button>
          </div>

          <!-- Body -->
          <div class="px-5 py-4 space-y-3">
            <!-- Amount -->
            <div class="flex items-baseline gap-1.5">
              <span class="text-[#9e9cae] text-sm font-bold">₹</span>
              <span class="text-3xl font-black tabular-nums tracking-tight" :class="selectedDebt.type === 'lent' ? 'text-[#B3F5E1]' : 'text-[#FFD1B3]'">{{ formatAmount(selectedDebt.amount) }}</span>
              <span
                class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold border"
                :class="selectedDebt.is_settled ? 'bg-[#191924] text-[#9e9cae] border-[#29293a]' : 'bg-[#D4BFFF]/15 text-[#D4BFFF] border-[#D4BFFF]/25'"
              >{{ selectedDebt.is_settled ? '✓ Settled' : '● Active' }}</span>
            </div>

            <!-- Meta rows -->
            <div class="space-y-2 pt-1">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider">Account</span>
                <span class="text-xs font-semibold text-[#f1f0f5]">{{ getAccountName(selectedDebt.account_id) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider">Date</span>
                <span class="text-xs font-semibold text-[#f1f0f5]">{{ formatDate(selectedDebt.created_at) }}</span>
              </div>
              <div v-if="selectedDebt.description" class="flex items-start justify-between gap-4">
                <span class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider shrink-0">Notes</span>
                <span class="text-xs text-[#ccc3d8] italic text-right">{{ selectedDebt.description }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="px-5 pb-5 flex gap-2">
            <button
              v-if="!selectedDebt.is_settled"
              @click="openSettleModal(selectedDebt); selectedDebt = null"
              class="flex-1 py-2.5 bg-[#B3F5E1] hover:bg-[#86efac] text-[#0f0f15] font-black text-xs rounded-xl transition cursor-pointer shadow-sm"
            >Settle Debt</button>
            <button
              @click="confirmDelete(selectedDebt); selectedDebt = null"
              class="px-4 py-2.5 bg-[#FFD1B3]/10 hover:bg-[#FFD1B3]/20 text-[#FFD1B3] border border-[#FFD1B3]/20 font-bold text-xs rounded-xl transition cursor-pointer"
            >Delete</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Custom App-Styled Delete Debt Confirmation Modal -->
    <Transition name="modal-fade">
      <div 
        v-if="showDeleteConfirmModal" 
        class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0c0d14]/95 backdrop-blur-md"
        @click.self="showDeleteConfirmModal = false"
      >
        <div class="relative w-full max-w-sm bg-[#0f1019] border border-[#1f202e] rounded-2xl shadow-2xl p-5 space-y-4 text-left">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-xl">delete_forever</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-[#f1f0f5]">Delete Debt Record</h3>
              <p class="text-xs text-[#9e9cae] mt-0.5 leading-snug">
                Are you sure you want to delete debt record for <strong class="text-[#f1f0f5]">"{{ debtToDelete?.person_name }}"</strong>? This action cannot be undone.
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1f202e]">
            <button 
              type="button" 
              @click="showDeleteConfirmModal = false" 
              class="px-4 py-2 bg-[#141520] hover:bg-[#191924] border border-[#1f202e] text-[#9e9cae] hover:text-[#f1f0f5] text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="button" 
              @click="executeDeleteDebt" 
              class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.22s var(--ease-out), transform 0.22s var(--ease-out); }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.96) translateY(6px); }
</style>

<script setup>
import { ref, computed } from 'vue';
import BucketGrid from './BucketGrid.vue';
import AccountGrid from './AccountGrid.vue';
import { formatDateDDMMYYYY } from '../utils/dateUtils';

const props = defineProps({
  debts: {
    type: Array,
    required: true
  },
  accounts: {
    type: Array,
    required: true
  },
  buckets: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['create-debt', 'settle-debt', 'delete-debt']);

// Filter states
const activeTab = ref('active'); // 'active', 'settled', 'all'
const searchQuery = ref('');

// Modal states
const showAddModal = ref(false);
const showSettleModal = ref(false);
const selectedDebt = ref(null);
const submitting = ref(false);

const openDetailModal = (debt) => { selectedDebt.value = debt; };

const newDebt = ref({
  person_name: '',
  type: 'lent',
  amount: '',
  account_id: '',
  bucket_id: '',
  description: ''
});

const settlingDebt = ref(null);
const settleAccountId = ref('');

// Formatters
const formatAmount = (val) => {
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (isoStr) => {
  return formatDateDDMMYYYY(isoStr);
};

const getAccountName = (accId) => {
  const acc = props.accounts.find(a => a.id === accId);
  return acc ? acc.name : 'Unknown Account';
};

// Computeds for metrics
const totalOwedToYou = computed(() => {
  return props.debts
    .filter(d => d.type === 'lent' && !d.is_settled)
    .reduce((sum, d) => sum + Number(d.amount), 0);
});

const totalYouOwe = computed(() => {
  return props.debts
    .filter(d => d.type === 'borrowed' && !d.is_settled)
    .reduce((sum, d) => sum + Number(d.amount), 0);
});

const netPosition = computed(() => {
  return totalOwedToYou.value - totalYouOwe.value;
});
const activeBuckets = computed(() => props.buckets.filter(bucket => !bucket.is_archived));

// Filtered debts list
const filteredDebts = computed(() => {
  return props.debts.filter(d => {
    // Tab filter
    if (activeTab.value === 'active' && d.is_settled) return false;
    if (activeTab.value === 'settled' && !d.is_settled) return false;

    // Search filter
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const nameMatch = d.person_name.toLowerCase().includes(q);
      const descMatch = d.description ? d.description.toLowerCase().includes(q) : false;
      if (!nameMatch && !descMatch) return false;
    }

    return true;
  });
});

// Handlers
const openAddModal = () => {
  newDebt.value = {
    person_name: '',
    type: 'lent',
    amount: '',
    account_id: props.accounts.length > 0 ? props.accounts[0].id : '',
    bucket_id: activeBuckets.value.length > 0 ? activeBuckets.value[0].id : '',
    description: ''
  };
  showAddModal.value = true;
};

const submitAddDebt = async () => {
  if (!newDebt.value.person_name.trim() || !newDebt.value.amount || !newDebt.value.account_id || !newDebt.value.bucket_id) return;
  submitting.value = true;
  try {
    emit('create-debt', {
      person_name: newDebt.value.person_name.trim(),
      type: newDebt.value.type,
      amount: Number(newDebt.value.amount),
      account_id: newDebt.value.account_id,
      bucket_id: newDebt.value.bucket_id,
      description: newDebt.value.description.trim() || null
    });
    showAddModal.value = false;
  } finally {
    submitting.value = false;
  }
};

const openSettleModal = (debt) => {
  settlingDebt.value = debt;
  settleAccountId.value = debt.account_id || (props.accounts.length > 0 ? props.accounts[0].id : '');
  showSettleModal.value = true;
};

const submitSettleDebt = async () => {
  if (!settlingDebt.value || !settleAccountId.value) return;
  submitting.value = true;
  try {
    emit('settle-debt', settlingDebt.value.id, settleAccountId.value);
    showSettleModal.value = false;
  } finally {
    submitting.value = false;
  }
};

const showDeleteConfirmModal = ref(false);
const debtToDelete = ref(null);

const confirmDelete = (debt) => {
  debtToDelete.value = debt;
  showDeleteConfirmModal.value = true;
};

const executeDeleteDebt = () => {
  if (debtToDelete.value) {
    emit('delete-debt', debtToDelete.value.id);
  }
  showDeleteConfirmModal.value = false;
  debtToDelete.value = null;
};
</script>
