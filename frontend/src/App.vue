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
    showSuccess(wasEditing ? 'Transaction updated' : 'Transaction added');
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
  } catch (err) {
    alert(err.message || 'Failed to record debt entry.');
  }
};

const handleSettleDebt = async (id, payload) => {
  try {
    await api.settleDebt(id, payload);
    await refreshAll();
  } catch (err) {
    alert(err.message || 'Failed to settle debt.');
  }
};

const handleDeleteDebt = async (id) => {
  try {
    await api.deleteDebt(id);
    await refreshAll();
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
  <div class="min-h-screen flex flex-col bg-[#0b111e]">
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
    </Transition>
    <!-- Navbar -->
    <header class="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 safe-area-pt">
      <div class="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <img src="/cashbuddy-logo.svg" alt="Cash Buddy Logo" class="w-9 h-9 object-contain" />
          <div class="flex flex-col">
            <span class="font-bold text-slate-100 tracking-tight text-base sm:text-lg leading-tight">Cash Buddy</span>
            <span class="text-[9px] text-indigo-300 font-medium hidden sm:inline">Your Personal Expense Tracker</span>
          </div>
          
          <!-- Vault Switcher Pill Button -->
          <button 
            @click="showVaultModal = true"
            class="ml-1 sm:ml-2 px-2.5 py-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title="Click to switch or manage database vaults"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="truncate max-w-[100px] sm:max-w-none">🏦 <strong class="text-indigo-400">{{ activeVaultName }}</strong></span>
            <span class="text-[10px] text-slate-500">▾</span>
          </button>
        </div>

        <!-- Desktop Navigation Tabs -->
        <nav class="hidden sm:flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button 
            @click="currentTab = 'dashboard'"
            class="px-4 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer"
            :class="currentTab === 'dashboard' ? 'bg-slate-900 text-slate-100' : 'text-slate-400 hover:text-slate-200'"
          >
            Dashboard
          </button>
          <button 
            @click="currentTab = 'transactions'"
            class="px-4 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer"
            :class="currentTab === 'transactions' ? 'bg-slate-900 text-slate-100' : 'text-slate-400 hover:text-slate-200'"
          >
            Transactions
          </button>
          <button 
            @click="currentTab = 'debts'"
            class="px-4 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer"
            :class="currentTab === 'debts' ? 'bg-slate-900 text-slate-100' : 'text-slate-400 hover:text-slate-200'"
          >
            Debt List
          </button>
          <button 
            @click="currentTab = 'settings'"
            class="px-4 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer"
            :class="currentTab === 'settings' ? 'bg-slate-900 text-slate-100' : 'text-slate-400 hover:text-slate-200'"
          >
            Settings
          </button>
        </nav>
      </div>
    </header>

    <!-- Main Content Container with Bottom Padding for Mobile Nav Bar -->
    <main class="flex-grow max-w-6xl w-full mx-auto px-4 md:px-6 py-6 pb-24 sm:pb-8">
      <!-- Error Banner -->
      <div v-if="error" class="mb-6 p-4 bg-rose-950/40 border border-rose-900/50 rounded-2xl flex justify-between items-center">
        <div class="flex gap-3 items-center">
          <span class="text-rose-400 text-lg">⚠️</span>
          <p class="text-sm text-rose-300 font-medium">{{ error }}</p>
        </div>
        <button @click="error = ''" class="text-slate-400 hover:text-slate-200 text-sm">Dismiss</button>
      </div>

      <!-- Non-blocking Loading Indicator -->
      <div v-if="loading && transactions.length === 0" class="fixed top-20 right-6 z-50 bg-indigo-950/90 border border-indigo-500/50 px-3.5 py-2 rounded-xl flex items-center gap-2.5 shadow-xl backdrop-blur-md">
        <div class="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-xs font-semibold text-indigo-200">Initializing Cash Buddy...</span>
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
        />
      </div>
    </main>

    <!-- Mobile Bottom Navigation Bar (Visible on < sm screens) -->
    <nav class="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-3 py-2 flex items-center justify-around shadow-2xl safe-area-pb">
      <button 
        @click="currentTab = 'dashboard'"
        class="flex flex-col items-center gap-1 text-[11px] font-semibold transition cursor-pointer"
        :class="currentTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'"
      >
        <span class="text-lg">📊</span>
        <span>Dashboard</span>
      </button>

      <button 
        @click="currentTab = 'transactions'"
        class="flex flex-col items-center gap-1 text-[11px] font-semibold transition cursor-pointer"
        :class="currentTab === 'transactions' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'"
      >
        <span class="text-lg">💸</span>
        <span>History</span>
      </button>

      <!-- Center Floating Quick Add Action Button -->
      <button 
        @click="openAddTransaction()"
        class="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-600/40 border-2 border-slate-900 transition active:scale-95 cursor-pointer shrink-0"
        title="Add Transaction"
      >
        ＋
      </button>

      <button 
        @click="currentTab = 'debts'"
        class="flex flex-col items-center gap-1 text-[11px] font-semibold transition cursor-pointer"
        :class="currentTab === 'debts' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'"
      >
        <span class="text-lg">🤝</span>
        <span>Debts</span>
      </button>

      <button 
        @click="currentTab = 'settings'"
        class="flex flex-col items-center gap-1 text-[11px] font-semibold transition cursor-pointer"
        :class="currentTab === 'settings' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'"
      >
        <span class="text-lg">⚙️</span>
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
