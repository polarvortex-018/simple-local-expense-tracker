<script setup>
import { ref, onMounted } from 'vue';
import { api } from './services/api';
import Dashboard from './components/Dashboard.vue';
import TransactionList from './components/TransactionList.vue';
import TransactionForm from './components/TransactionForm.vue';
import DebtList from './components/DebtList.vue';
import SettingsView from './components/SettingsView.vue';

// State
const currentTab = ref('dashboard'); // 'dashboard', 'transactions', 'debts', or 'settings'
const transactions = ref([]);
const accounts = ref([]);
const categories = ref([]);
const buckets = ref([]);
const debts = ref([]);

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
const loading = ref(false);
const error = ref('');

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
      return {
        start_date: null,
        end_date: null
      };
  }
};

// Fetch all metadata (accounts, categories, & savings buckets)
const fetchMetadata = async () => {
  try {
    const [accData, catData, bucketData] = await Promise.all([
      api.getAccounts(),
      api.getCategories(),
      api.getBuckets(true)
    ]);
    accounts.value = accData;
    categories.value = catData;
    buckets.value = bucketData;
  } catch (err) {
    error.value = 'Failed to load initial data. Is the backend server running?';
    console.error(err);
  }
};

// Fetch debts
const fetchDebts = async () => {
  try {
    debts.value = await api.getDebts();
  } catch (err) {
    console.error('Failed to fetch debts:', err);
  }
};

// Fetch transactions based on current filters and page
const fetchTransactions = async () => {
  loading.value = true;
  try {
    const skip = (page.value - 1) * limit;
    const { start_date, end_date } = calculateDates(
      filters.value.time_range,
      filters.value.start_date,
      filters.value.end_date
    );

    const txData = await api.getTransactions({
      search: filters.value.search,
      account_id: filters.value.account_id,
      bucket_id: filters.value.bucket_id,
      category_id: filters.value.category_ids,
      transaction_type: filters.value.transaction_type,
      start_date,
      end_date,
      skip,
      limit
    });
    transactions.value = txData;
  } catch (err) {
    error.value = err.message || 'Failed to fetch transactions.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Complete refresh across all modules
const refreshAll = async () => {
  await Promise.all([
    fetchMetadata(),
    fetchTransactions(),
    fetchDebts()
  ]);
};

// Handlers
const handleFilterChange = (newFilters) => {
  filters.value = newFilters;
  page.value = 1;
  fetchTransactions();
};

const handlePageChange = (newPage) => {
  page.value = newPage;
  fetchTransactions();
};

const openAddTransaction = () => {
  editingTransaction.value = null;
  showForm.value = true;
};

const openEditTransaction = (tx) => {
  editingTransaction.value = tx;
  showForm.value = true;
};

const handleSaveTransaction = async (payload) => {
  try {
    if (editingTransaction.value) {
      await api.updateTransaction(editingTransaction.value.id, payload);
    } else {
      await api.createTransaction(payload);
    }
    showForm.value = false;
    editingTransaction.value = null;
    await refreshAll();
  } catch (err) {
    alert(err.message || 'Failed to save transaction.');
  }
};

const handleDeleteTransaction = async (id) => {
  try {
    await api.deleteTransaction(id);
    await refreshAll();
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
    alert(err.message || 'Failed to delete/archive bucket.');
  }
};

const handleTransferBucket = async (payload) => {
  try {
    await api.transferBucket(payload);
    await refreshAll();
  } catch (err) {
    alert(err.message || 'Failed to transfer funds between buckets.');
  }
};

// Debt Handlers
const handleCreateDebt = async (payload) => {
  try {
    await api.createDebt(payload);
    await refreshAll();
  } catch (err) {
    alert(err.message || 'Failed to record debt.');
  }
};

const handleSettleDebt = async (debtId, accountId) => {
  try {
    await api.settleDebt(debtId, { account_id: accountId });
    await refreshAll();
  } catch (err) {
    alert(err.message || 'Failed to settle debt.');
  }
};

const handleDeleteDebt = async (debtId) => {
  try {
    await api.deleteDebt(debtId);
    await refreshAll();
  } catch (err) {
    alert(err.message || 'Failed to delete debt.');
  }
};

onMounted(() => {
  refreshAll();
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#0b111e]">
    <!-- Navbar -->
    <header class="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div class="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
            F
          </div>
          <span class="font-bold text-slate-100 tracking-tight text-lg">Finance Tracker</span>
        </div>

        <nav class="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
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

    <!-- Main Content Container -->
    <main class="flex-grow max-w-6xl w-full mx-auto px-4 md:px-6 py-8">
      <!-- Error Banner -->
      <div v-if="error" class="mb-6 p-4 bg-rose-950/40 border border-rose-900/50 rounded-2xl flex justify-between items-center">
        <div class="flex gap-3 items-center">
          <span class="text-rose-400 text-lg">⚠️</span>
          <p class="text-sm text-rose-300 font-medium">{{ error }}</p>
        </div>
        <button @click="error = ''" class="text-slate-400 hover:text-slate-200 text-sm">Dismiss</button>
      </div>

      <!-- Tab Views -->
      <div v-if="loading && transactions.length === 0" class="flex flex-col items-center justify-center py-20 gap-4">
        <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-slate-400 text-sm font-medium">Loading data...</p>
      </div>

      <div v-else>
        <Dashboard 
          v-if="currentTab === 'dashboard'" 
          :accounts="accounts"
          :transactions="transactions"
          :categories="categories"
          :buckets="buckets"
          @add-transaction="openAddTransaction"
        />

        <TransactionList 
          v-if="currentTab === 'transactions'"
          :transactions="transactions"
          :accounts="accounts"
          :categories="categories"
          :buckets="buckets"
          :page="page"
          :limit="limit"
          :filters="filters"
          @add-transaction="openAddTransaction"
          @edit-transaction="openEditTransaction"
          @delete-transaction="handleDeleteTransaction"
          @update-filters="handleFilterChange"
          @update-page="handlePageChange"
        />

        <DebtList
          v-if="currentTab === 'debts'"
          :debts="debts"
          :accounts="accounts"
          @create-debt="handleCreateDebt"
          @settle-debt="handleSettleDebt"
          @delete-debt="handleDeleteDebt"
        />

        <SettingsView
          v-if="currentTab === 'settings'"
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
        />
      </div>
    </main>

    <!-- Slide-over / Modal Form -->
    <TransactionForm 
      v-if="showForm" 
      :transaction="editingTransaction"
      :accounts="accounts"
      :categories="categories"
      :buckets="buckets"
      @close="showForm = false"
      @save="handleSaveTransaction"
    />

    <!-- Footer -->
    <footer class="bg-slate-950/40 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
      <p>&copy; 2026 Finance Tracker App. Local-first, offline-first expense manager.</p>
    </footer>
  </div>
</template>
