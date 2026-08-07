<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from './services/api';
import Dashboard from './components/Dashboard.vue';
import TransactionList from './components/TransactionList.vue';
import TransactionForm from './components/TransactionForm.vue';
import DebtList from './components/DebtList.vue';
import SettingsView from './components/SettingsView.vue';
import VaultModal from './components/VaultModal.vue';

// State
const currentTab = ref('dashboard'); // 'dashboard', 'transactions', 'debts', or 'settings'
const transactions = ref([]);
const dashboardTransactions = ref([]);
const transactionSummary = ref({ total_count: 0, total_income: 0, total_expense: 0, categories_breakdown: [] });
const accounts = ref([]);
const categories = ref([]);
const buckets = ref([]);
const debts = ref([]);

// Vaults State
const vaults = ref([]);
const activeVault = ref('finance.db');
const showVaultModal = ref(false);

const activeVaultName = computed(() => {
  const v = vaults.value.find(item => item.is_active);
  return v ? v.name : 'Personal';
});

// Pagination & filters
const filters = ref({
  search: '',
  account_id: '',
  bucket_id: '',
  category_ids: [],
  transaction_type: '',
  time_range: '',
  start_date: '',
  end_date: ''
});
const page = ref(1);
const limit = 20;

// Modal control
const showForm = ref(false);
const editingTransaction = ref(null);
const selectedBucketForTx = ref('');
const selectedTypeForTx = ref('expense');
const loading = ref(false);
const error = ref('');
const successMessage = ref('');
let successTimer;

const showSuccess = (message) => {
  successMessage.value = message;
  clearTimeout(successTimer);
  successTimer = setTimeout(() => {
    successMessage.value = '';
  }, 1800);
};

// Helper to calculate start and end dates from a relative range choice
const calculateDates = (timeRange, customStart, customEnd) => {
  if (timeRange === 'custom') {
    return {
      start_date: customStart || null,
      end_date: customEnd || null
    };
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed

  const formatDateStr = (dObj) => {
    const y = dObj.getFullYear();
    const m = String(dObj.getMonth() + 1).padStart(2, '0');
    const d = String(dObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  switch (timeRange) {
    case 'this_month': {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return { start_date: formatDateStr(start), end_date: formatDateStr(end) };
    }
    case 'last_month': {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return { start_date: formatDateStr(start), end_date: formatDateStr(end) };
    }
    case 'last_3_months': {
      const start = new Date(year, month - 3, 1);
      const end = new Date(year, month + 1, 0);
      return { start_date: formatDateStr(start), end_date: formatDateStr(end) };
    }
    case 'last_6_months': {
      const start = new Date(year, month - 6, 1);
      const end = new Date(year, month + 1, 0);
      return { start_date: formatDateStr(start), end_date: formatDateStr(end) };
    }
    case 'this_year': {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      return { start_date: formatDateStr(start), end_date: formatDateStr(end) };
    }
    default:
      return { start_date: null, end_date: null };
  }
};

const fetchTransactions = async () => {
  try {
    const { start_date, end_date } = calculateDates(
      filters.value.time_range,
      filters.value.start_date,
      filters.value.end_date
    );

    const apiParams = {
      skip: (page.value - 1) * limit,
      limit: limit,
      search: filters.value.search || undefined,
      account_id: filters.value.account_id || undefined,
      bucket_id: filters.value.bucket_id || undefined,
      category_id: filters.value.category_ids.length > 0 ? filters.value.category_ids : undefined,
      transaction_type: filters.value.transaction_type || undefined,
      start_date: start_date || undefined,
      end_date: end_date || undefined
    };

    const summaryParams = { ...apiParams };
    delete summaryParams.skip;
    delete summaryParams.limit;
    [transactions.value, transactionSummary.value] = await Promise.all([
      api.getTransactions(apiParams),
      api.getTransactionSummary(summaryParams)
    ]);
  } catch (err) {
    error.value = 'Failed to load transactions: ' + err.message;
  }
};

const fetchAccounts = async () => {
  try {
    accounts.value = await api.getAccounts();
  } catch (err) {
    error.value = 'Failed to load accounts: ' + err.message;
  }
};

const fetchCategories = async () => {
  try {
    categories.value = await api.getCategories();
  } catch (err) {
    error.value = 'Failed to load categories: ' + err.message;
  }
};

const fetchBuckets = async () => {
  try {
    buckets.value = await api.getBuckets(true);
  } catch (err) {
    error.value = 'Failed to load savings buckets: ' + err.message;
  }
};

const fetchDebts = async () => {
  try {
    debts.value = await api.getDebts();
  } catch (err) {
    error.value = 'Failed to load debts: ' + err.message;
  }
};

const loadVaults = async () => {
  try {
    vaults.value = await api.getVaults();
    const active = vaults.value.find(v => v.is_active);
    if (active) activeVault.value = active.filename;
  } catch (err) {
    console.error("Failed to load vaults:", err);
  }
};

const refreshAll = async () => {
  loading.value = true;
  error.value = '';
  try {
    await api.init();
    await Promise.all([
      fetchTransactions(),
      fetchAccounts(),
      fetchCategories(),
      fetchBuckets(),
      fetchDebts(),
      loadVaults()
    ]);
    dashboardTransactions.value = await api.getTransactions();
  } catch (err) {
    console.error("refreshAll error:", err);
    error.value = err.message || 'Error loading local database';
  } finally {
    loading.value = false;
  }
};

// Vault Management Handlers
const handleSwitchVault = async (filename) => {
  try {
    await api.switchVault(filename);
    await refreshAll();
    showVaultModal.value = false;
  } catch (err) {
    alert(err.message || 'Failed to switch vault.');
  }
};

const handleCreateVault = async (name) => {
  try {
    await api.createVault(name);
    await refreshAll();
    showVaultModal.value = false;
  } catch (err) {
    alert(err.message || 'Failed to create vault.');
  }
};

const handleImportVault = async (file) => {
  try {
    await api.importVault(file);
    await refreshAll();
    showVaultModal.value = false;
  } catch (err) {
    alert(err.message || 'Failed to import vault.');
  }
};

const handleDeleteVault = async (filename) => {
  if (confirm(`Are you sure you want to delete vault "${filename}"? This action cannot be undone.`)) {
    try {
      await api.deleteVault(filename);
      await loadVaults();
    } catch (err) {
      alert(err.message || 'Failed to delete vault.');
    }
  }
};

// Filter & Pagination Handlers
const handleUpdateFilters = (newFilters) => {
  filters.value = newFilters;
  page.value = 1;
  fetchTransactions();
};

const handleUpdatePage = (newPage) => {
  page.value = newPage;
  fetchTransactions();
};

// Form Open/Close Handlers
const openAddTransaction = (opts = {}) => {
  editingTransaction.value = null;
  selectedBucketForTx.value = opts.bucketId || '';
  selectedTypeForTx.value = opts.type || 'expense';
  showForm.value = true;
};

const openEditTransaction = (transaction) => {
  editingTransaction.value = transaction;
  selectedBucketForTx.value = transaction.bucket_id || '';
  selectedTypeForTx.value = transaction.transaction_type || 'expense';
  showForm.value = true;
};

const handleSaveTransaction = async (payload) => {
  try {
    const wasEditing = Boolean(editingTransaction.value);
    if (editingTransaction.value) {
      await api.updateTransaction(editingTransaction.value.id, payload);
    } else {
      await api.createTransaction(payload);
    }
    showForm.value = false;
    await refreshAll();
    showSuccess(payload.transaction_type === 'adjustment'
      ? (wasEditing ? 'Adjustment updated' : 'Adjustment recorded')
      : (wasEditing ? 'Transaction updated' : 'Transaction added'));
  } catch (err) {
    alert(err.message || 'Failed to save transaction.');
  }
};

const handleDeleteTransaction = async (id) => {
  try {
    await api.deleteTransaction(id);
    await refreshAll();
    showSuccess('Transaction deleted');
  } catch (err) {
    alert(err.message || 'Failed to delete transaction.');
  }
};

// Account & Category Handlers
const handleCreateAccount = async (payload) => {
  try {
    await api.createAccount(payload);
    await refreshAll();
  } catch (err) {
    alert(err.message || 'Failed to create account.');
  }
};

const handleUpdateAccount = async (id, payload) => {
  try {
    await api.updateAccount(id, payload);
    await refreshAll();
  } catch (err) {
    alert(err.message || 'Failed to update account.');
  }
};

const handleDeleteAccount = async (id) => {
  try {
    await api.deleteAccount(id);
    await refreshAll();
  } catch (err) {
    alert(err.message || 'Failed to delete account.');
  }
};

const handleCreateCategory = async (payload) => {
  try {
    await api.createCategory(payload);
    await refreshAll();
  } catch (err) {
    alert(err.message || 'Failed to create category.');
  }
};

const handleUpdateCategory = async (id, payload) => {
  try {
    await api.updateCategory(id, payload);
    await refreshAll();
  } catch (err) {
    alert(err.message || 'Failed to update category.');
  }
};

const handleDeleteCategory = async (id) => {
  try {
    await api.deleteCategory(id);
    await refreshAll();
  } catch (err) {
    alert(err.message || 'Failed to delete category.');
  }
};

// Savings Bucket Handlers
const handleCreateBucket = async (payload) => {
  try {
    await api.createBucket(payload);
    await refreshAll();
  } catch (err) {
    alert(err.message || 'Failed to create savings bucket.');
  }
};

const handleUpdateBucket = async (id, payload) => {
  try {
    await api.updateBucket(id, payload);
    await refreshAll();
  } catch (err) {
    alert(err.message || 'Failed to update savings bucket.');
  }
};

const handleDeleteBucket = async (id) => {
  try {
    await api.deleteBucket(id);
    await refreshAll();
    showSuccess('Bucket permanently deleted');
  } catch (err) {
    alert(err.message || 'Failed to delete savings bucket.');
  }
};

const handleTransferBucket = async (payload) => {
  try {
    await api.transferBucket(payload);
    await refreshAll();
  } catch (err) {
    alert(err.message || 'Failed to transfer bucket funds.');
  }
};

const handleAllocateUnassigned = async ({ bucketId, amount }) => {
  try {
    await api.allocateUnassigned(bucketId, amount);
    await refreshAll();
    showSuccess('Unassigned money allocated');
  } catch (err) {
    alert(err.message || 'Failed to allocate unassigned money.');
  }
};

const handleReorderBuckets = async (bucketIds) => {
  try {
    await api.updateBucketSortOrder(bucketIds);
    await refreshAll();
  } catch (err) {
    alert(err.message || 'Failed to reorder buckets.');
  }
};

// Debt Handlers
const handleCreateDebt = async (payload) => {
  try {
    await api.createDebt(payload);
    await refreshAll();
    showSuccess('Debt recorded');
  } catch (err) {
    alert(err.message || 'Failed to record debt entry.');
  }
};

const handleSettleDebt = async (id, payload) => {
  try {
    await api.settleDebt(id, payload);
    await refreshAll();
    showSuccess('Debt settled');
  } catch (err) {
    alert(err.message || 'Failed to settle debt.');
  }
};

const handleDeleteDebt = async (id) => {
  try {
    await api.deleteDebt(id);
    await refreshAll();
    showSuccess('Debt deleted');
  } catch (err) {
    alert(err.message || 'Failed to delete debt.');
  }
};

onMounted(() => {
  window.addEventListener('cashbuddy-storage-error', event => {
    error.value = `Your latest change could not be saved securely: ${event.detail}`;
  });
  refreshAll();
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#0b1326] text-slate-100">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="successMessage"
        class="pointer-events-none fixed top-[max(1rem,env(safe-area-inset-top))] left-1/2 z-[80] -translate-x-1/2 rounded-full border border-emerald-500/40 bg-emerald-950/95 px-4 py-2.5 text-xs font-bold text-emerald-200 shadow-2xl backdrop-blur-lg"
        role="status"
        aria-live="polite"
      >
        ✓ {{ successMessage }}
      </div>
    </Transition>    <!-- Navbar / TopAppBar -->
    <header class="bg-[#0b1326] border-b border-[#31394d] sticky top-0 z-40 safe-area-pt">
      <div class="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <img src="/cashbuddy-logo.svg" alt="Cash Buddy Logo" class="w-8 h-8 object-contain" />
          <div class="flex flex-col">
            <span class="font-bold text-[#d2bbff] tracking-tight text-lg leading-tight">Cash Buddy</span>
          </div>
          
          <!-- Vault Switcher Pill Button -->
          <button 
            @click="showVaultModal = true"
            class="ml-1 sm:ml-2 px-2.5 py-1 bg-[#131b2e] hover:bg-[#222a3d] border border-[#31394d] hover:border-[#7c3aed] rounded-full text-xs font-semibold text-[#dae2fd] flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title="Click to switch or manage database vaults"
          >
            <span class="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
            <span class="truncate max-w-[100px] sm:max-w-none">🏦 <strong class="text-[#d2bbff]">{{ activeVaultName }}</strong></span>
            <span class="text-[10px] text-[#ccc3d8]">▾</span>
          </button>
        </div>

        <!-- Desktop Navigation Tabs -->
        <nav class="hidden sm:flex gap-1 bg-[#131b2e] p-1 rounded-xl border border-[#31394d]">
          <button 
            @click="currentTab = 'dashboard'"
            class="px-3.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5"
            :class="currentTab === 'dashboard' ? 'bg-[#7c3aed] text-white' : 'text-[#ccc3d8] hover:text-[#dae2fd]'"
          >
            <span class="material-symbols-outlined text-[16px]">dashboard</span>
            <span>Dashboard</span>
          </button>
          <button 
            @click="currentTab = 'transactions'"
            class="px-3.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5"
            :class="currentTab === 'transactions' ? 'bg-[#7c3aed] text-white' : 'text-[#ccc3d8] hover:text-[#dae2fd]'"
          >
            <span class="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>Transactions</span>
          </button>
          <button 
            @click="currentTab = 'debts'"
            class="px-3.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5"
            :class="currentTab === 'debts' ? 'bg-[#7c3aed] text-white' : 'text-[#ccc3d8] hover:text-[#dae2fd]'"
          >
            <span class="material-symbols-outlined text-[16px]">account_balance_wallet</span>
            <span>Debt List</span>
          </button>
          <button 
            @click="currentTab = 'settings'"
            class="px-3.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5"
            :class="currentTab === 'settings' ? 'bg-[#7c3aed] text-white' : 'text-[#ccc3d8] hover:text-[#dae2fd]'"
          >
            <span class="material-symbols-outlined text-[16px]">settings</span>
            <span>Settings</span>
          </button>
        </nav>
      </div>
    </header>

    <!-- Main Content Container with Bottom Padding for Mobile Nav Bar -->
    <main class="flex-grow max-w-6xl w-full mx-auto px-3 md:px-6 py-4 pb-24 sm:pb-8">
      <!-- Error Banner -->
      <div v-if="error" class="mb-4 p-3 bg-rose-950/40 border border-rose-900/50 rounded-lg flex justify-between items-center">
        <div class="flex gap-2.5 items-center">
          <span class="text-rose-400 text-base">⚠️</span>
          <p class="text-xs text-rose-300 font-medium">{{ error }}</p>
        </div>
        <button @click="error = ''" class="text-[#ccc3d8] hover:text-[#dae2fd] text-xs">Dismiss</button>
      </div>

      <!-- Non-blocking Loading Indicator -->
      <div v-if="loading && transactions.length === 0" class="fixed top-16 right-4 z-50 bg-[#131b2e] border border-[#7c3aed]/50 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg backdrop-blur-md">
        <div class="w-3 h-3 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
        <span class="text-[11px] font-semibold text-[#d2bbff]">Initializing...</span>
      </div>

      <div>
        <Dashboard 
          v-show="currentTab === 'dashboard'" 
          :accounts="accounts"
          :transactions="dashboardTransactions"
          :categories="categories"
          :buckets="buckets"
          @add-transaction="openAddTransaction"
        />

        <TransactionList 
          v-show="currentTab === 'transactions'"
          :transactions="transactions"
          :accounts="accounts"
          :categories="categories"
          :buckets="buckets"
          :page="page"
          :limit="limit"
          :filters="filters"
          :summary="transactionSummary"
          @add-transaction="openAddTransaction"
          @edit-transaction="openEditTransaction"
          @delete-transaction="handleDeleteTransaction"
          @update-filters="handleUpdateFilters"
          @update-page="handleUpdatePage"
        />

        <DebtList 
          v-show="currentTab === 'debts'"
          :debts="debts"
          :accounts="accounts"
          :buckets="buckets"
          @create-debt="handleCreateDebt"
          @settle-debt="handleSettleDebt"
          @delete-debt="handleDeleteDebt"
        />

        <SettingsView 
          v-show="currentTab === 'settings'"
          :accounts="accounts"
          :categories="categories"
          :buckets="buckets"
          @create-account="handleCreateAccount"
          @update-account="handleUpdateAccount"
          @delete-account="handleDeleteAccount"
          @create-category="handleCreateCategory"
          @update-category="handleUpdateCategory"
          @delete-category="handleDeleteCategory"
          @create-bucket="handleCreateBucket"
          @update-bucket="handleUpdateBucket"
          @delete-bucket="handleDeleteBucket"
          @transfer-bucket="handleTransferBucket"
          @reorder-buckets="handleReorderBuckets"
          @allocate-unassigned="handleAllocateUnassigned"
        />
      </div>
    </main>

    <!-- BottomNavBar (Material 3 Theme) -->
    <nav class="bg-[#171f33] border-t border-[#31394d] fixed bottom-0 w-full z-50 flex justify-around items-center h-16 px-4 md:hidden safe-area-pb">
      <button 
        @click="currentTab = 'dashboard'"
        class="flex flex-col items-center justify-center font-semibold text-xs active:scale-95 transition-transform duration-150 cursor-pointer"
        :class="currentTab === 'dashboard' ? 'bg-[#7c3aed] text-white rounded-xl px-3 py-1' : 'text-[#ccc3d8] hover:text-[#d2bbff]'"
      >
        <span class="material-symbols-outlined mb-0.5" :style="{ fontVariationSettings: currentTab === 'dashboard' ? '\'FILL\' 1' : '\'FILL\' 0' }">dashboard</span>
        <span>Home</span>
      </button>

      <button 
        @click="currentTab = 'transactions'"
        class="flex flex-col items-center justify-center font-semibold text-xs active:scale-95 transition-transform duration-150 cursor-pointer"
        :class="currentTab === 'transactions' ? 'bg-[#7c3aed] text-white rounded-xl px-3 py-1' : 'text-[#ccc3d8] hover:text-[#d2bbff]'"
      >
        <span class="material-symbols-outlined mb-0.5" :style="{ fontVariationSettings: currentTab === 'transactions' ? '\'FILL\' 1' : '\'FILL\' 0' }">receipt_long</span>
        <span>History</span>
      </button>

      <!-- Quick Log Action Button -->
      <button 
        @click="openAddTransaction()"
        class="w-11 h-11 -mt-4 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white flex items-center justify-center font-bold text-lg shadow-md border-2 border-[#0b1326] transition active:scale-95 cursor-pointer shrink-0"
        title="Add Transaction"
      >
        <span class="material-symbols-outlined text-[24px]">add</span>
      </button>

      <button 
        @click="currentTab = 'debts'"
        class="flex flex-col items-center justify-center font-semibold text-xs active:scale-95 transition-transform duration-150 cursor-pointer"
        :class="currentTab === 'debts' ? 'bg-[#7c3aed] text-white rounded-xl px-3 py-1' : 'text-[#ccc3d8] hover:text-[#d2bbff]'"
      >
        <span class="material-symbols-outlined mb-0.5" :style="{ fontVariationSettings: currentTab === 'debts' ? '\'FILL\' 1' : '\'FILL\' 0' }">account_balance_wallet</span>
        <span>Debt</span>
      </button>

      <button 
        @click="currentTab = 'settings'"
        class="flex flex-col items-center justify-center font-semibold text-xs active:scale-95 transition-transform duration-150 cursor-pointer"
        :class="currentTab === 'settings' ? 'bg-[#7c3aed] text-white rounded-xl px-3 py-1' : 'text-[#ccc3d8] hover:text-[#d2bbff]'"
      >
        <span class="material-symbols-outlined mb-0.5" :style="{ fontVariationSettings: currentTab === 'settings' ? '\'FILL\' 1' : '\'FILL\' 0' }">settings</span>
        <span>Settings</span>
      </button>
    </nav>

    <!-- Slide-over / Modal Form -->
    <TransactionForm 
      v-if="showForm" 
      :transaction="editingTransaction"
      :accounts="accounts"
      :categories="categories"
      :buckets="buckets"
      :default-bucket-id="selectedBucketForTx"
      :default-type="selectedTypeForTx"
      @close="showForm = false"
      @save="handleSaveTransaction"
    />

    <!-- Multi-Vault Management Modal -->
    <VaultModal 
      :is-open="showVaultModal"
      :vaults="vaults"
      @close="showVaultModal = false"
      @switch-vault="handleSwitchVault"
      @create-vault="handleCreateVault"
      @import-vault="handleImportVault"
      @delete-vault="handleDeleteVault"
    />
  </div>
</template>
