<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from './services/api';
import Dashboard from './components/Dashboard.vue';
import TransactionList from './components/TransactionList.vue';
import TransactionForm from './components/TransactionForm.vue';
import DebtList from './components/DebtList.vue';
import SettingsView from './components/SettingsView.vue';
import VaultModal from './components/VaultModal.vue';
import OnboardingModal from './components/OnboardingModal.vue';

// State
const currentTab = ref('dashboard'); // 'dashboard', 'transactions', 'debts', or 'settings'
const transactions = ref([]);
const dashboardTransactions = ref([]);
const transactionSummary = ref({ total_count: 0, total_income: 0, total_expense: 0, categories_breakdown: [] });
const accounts = ref([]);
const categories = ref([]);
const buckets = ref([]);
const debts = ref([]);

// Onboarding State
const showOnboardingModal = ref(false);
const onboardingStage = ref('setup');

const checkOnboarding = async () => {
  try {
    const ob = await api.getOnboardingState();
    if (!ob.setupComplete || !ob.tutorialComplete) {
      onboardingStage.value = !ob.setupComplete ? 'setup' : 'tutorial';
      showOnboardingModal.value = true;
    }
  } catch (err) {
    console.error('Check onboarding error:', err);
  }
};

const openTutorial = () => {
  onboardingStage.value = 'tutorial';
  showOnboardingModal.value = true;
};

// Vaults State
const vaults = ref([]);
const activeVault = ref('finance.db');
const showVaultModal = ref(false);

// Toast Notification State
const toastMessage = ref('');
let toastTimer = null;

const showToast = (msg) => {
  if (toastTimer) clearTimeout(toastTimer);
  toastMessage.value = msg;
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 2800);
};

const activeVaultName = computed(() => {
  const v = vaults.value.find(item => item.is_active);
  return v ? v.name : 'Personal';
});

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

const fetchTransactions = async () => {
  try {
    [transactions.value, transactionSummary.value] = await Promise.all([
      api.getTransactions({ limit: 10000 }),
      api.getTransactionSummary({ limit: 10000 })
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
    await checkOnboarding();
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

const handleRenameVault = async ({ filename, name }) => {
  try {
    await api.renameVault(filename, name);
    await loadVaults();
    showSuccess('Vault renamed successfully');
  } catch (err) {
    alert(err.message || 'Failed to rename vault.');
  }
};

// Form Open/Close Handlers
const transactionFormStep = ref(1);

const openAddTransaction = (opts = {}) => {
  editingTransaction.value = null;
  selectedBucketForTx.value = opts.bucketId || '';
  selectedTypeForTx.value = opts.type || 'expense';
  transactionFormStep.value = opts.step || 1;
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

const handleDirectSaveTransaction = async ({ id, payload }) => {
  try {
    await api.updateTransaction(id, payload);
    await refreshAll();
    showSuccess('Transaction updated');
  } catch (err) {
    alert(err.message || 'Failed to update transaction.');
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

const handleTransferAccounts = async (payload) => {
  try {
    await api.transferBetweenAccounts(payload);
    await refreshAll();
    showSuccess('Account transfer complete');
  } catch (err) {
    alert(err.message || 'Failed to transfer between accounts.');
  }
};

const handleDataRefresh = async () => {
  await refreshAll();
};

const handleAllocateUnassigned = async ({ bucketId, amount }) => {
  try {
    await api.transferBucket({ to_bucket_id: bucketId, amount });
    await refreshAll();
    showSuccess('Money deposited into bucket');
  } catch (err) {
    alert(err.message || 'Failed to deposit money into bucket.');
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

const handleReorderCategories = async (categoryIds) => {
  try {
    await api.updateCategorySortOrder(categoryIds);
    await refreshAll();
  } catch (err) {
    alert(err.message || 'Failed to reorder categories.');
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

import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

onMounted(() => {
  if (typeof window !== 'undefined' && window.visualViewport) {
    const handleVVResize = () => {
      document.documentElement.style.setProperty('--vv-height', `${window.visualViewport.height}px`);
    };
    window.visualViewport.addEventListener('resize', handleVVResize);
    window.visualViewport.addEventListener('scroll', handleVVResize);
    handleVVResize();
  }

  window.addEventListener('cashbuddy-storage-error', event => {
    error.value = `Your latest change could not be saved securely: ${event.detail}`;
  });
  refreshAll();

  if (Capacitor.isNativePlatform()) {
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#0f0f15' }).catch(() => {});

    CapApp.addListener('backButton', () => {
      if (showForm.value) {
        showForm.value = false;
      } else if (showVaultModal.value) {
        showVaultModal.value = false;
      } else if (currentTab.value !== 'dashboard') {
        currentTab.value = 'dashboard';
      } else {
        CapApp.exitApp();
      }
    });
  }
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#0c0d14] text-[#f1f0f5]">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="successMessage"
        class="pointer-events-none fixed top-[max(2.5rem,calc(env(safe-area-inset-top)+1rem))] left-1/2 z-[80] -translate-x-1/2 rounded-full border border-[#B3F5E1]/30 bg-[#0c0d14]/95 px-4 py-2 text-xs font-semibold text-[#B3F5E1] shadow-xl backdrop-blur-md flex items-center gap-1.5"
        role="status"
        aria-live="polite"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-[#B3F5E1]"></span>
        <span>{{ successMessage }}</span>
      </div>
    </Transition>

    <!-- Navbar / TopAppBar -->
    <header class="bg-[#0c0d14]/95 backdrop-blur-md border-b border-[#1f202e] sticky top-0 z-40 safe-area-pt">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <img src="/cashbuddy-logo.svg" alt="Cash Buddy Logo" class="w-7 h-7 object-contain" />
          <span class="font-bold text-[#D4BFFF] tracking-tight text-base leading-none">Cash Buddy</span>
          
          <!-- Vault Switcher Trigger -->
          <button 
            data-tour="vault-switcher"
            @click="showVaultModal = true"
            class="ml-1.5 px-2.5 py-1 bg-[#0f1019] hover:bg-[#141520] border border-[#1f202e] hover:border-[#D4BFFF]/50 rounded-full text-[11px] font-medium text-[#f1f0f5] flex items-center gap-1.5 transition cursor-pointer"
            :title="`Active Vault: ${activeVaultName}. Click to switch database.`"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-[#B3F5E1]"></span>
            <span class="text-[#9e9cae] truncate max-w-[90px]">{{ activeVaultName }}</span>
            <span class="text-[9px] text-[#9e9cae]">▾</span>
          </button>
        </div>

        <!-- Desktop Navigation Tabs -->
        <nav class="hidden sm:flex gap-1 bg-[#0f1019] p-1 rounded-xl border border-[#1f202e]">
          <button 
            @click="currentTab = 'dashboard'"
            class="px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5"
            :class="currentTab === 'dashboard' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
          >
            <span class="material-symbols-outlined text-base">dashboard</span>
            <span>Dashboard</span>
          </button>
          <button 
            data-tour="history-tab"
            @click="currentTab = 'transactions'"
            class="px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5"
            :class="currentTab === 'transactions' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
          >
            <span class="material-symbols-outlined text-base">receipt_long</span>
            <span>History</span>
          </button>
          <button 
            data-tour="debts-tab"
            @click="currentTab = 'debts'"
            class="px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5"
            :class="currentTab === 'debts' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
          >
            <span class="material-symbols-outlined text-base">account_balance_wallet</span>
            <span>Debts</span>
          </button>
          <button 
            data-tour="settings-tab"
            @click="currentTab = 'settings'"
            class="px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5"
            :class="currentTab === 'settings' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
          >
            <span class="material-symbols-outlined text-base">widgets</span>
            <span>More</span>
          </button>
        </nav>

        <!-- Desktop Quick Add Button -->
        <button
          data-tour="add-tx-btn"
          @click="openAddTransaction()"
          class="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs rounded-xl transition cursor-pointer shadow-sm ml-2"
        >
          <span class="material-symbols-outlined text-base leading-none">add</span>
          <span>New Transaction</span>
        </button>
      </div>
    </header>

    <!-- Main Content Container -->
    <main class="flex-grow max-w-5xl w-full mx-auto px-3.5 sm:px-6 py-4 pb-24 sm:pb-8">
      <!-- Spring Float Toast Notification Banner -->
      <Transition name="toast">
        <div 
          v-if="toastMessage"
          class="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#141520] border border-[#D4BFFF]/40 text-[#f1f0f5] text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-2 max-w-xs sm:max-w-sm pointer-events-none"
        >
          <span class="material-symbols-outlined text-base text-[#D4BFFF]">check_circle</span>
          <span>{{ toastMessage }}</span>
        </div>
      </Transition>

      <!-- Error Banner -->
      <div v-if="error" class="mb-4 p-3 bg-rose-950/30 border border-rose-900/40 rounded-xl flex justify-between items-center">
        <div class="flex gap-2.5 items-center">
          <span class="material-symbols-outlined text-rose-400 text-base">warning</span>
          <p class="text-xs text-rose-300 font-medium">{{ error }}</p>
        </div>
        <button @click="error = ''" class="text-[#9e9cae] hover:text-[#f1f0f5] text-xs font-semibold cursor-pointer">Dismiss</button>
      </div>

      <!-- Non-blocking Loading Indicator -->
      <div v-if="loading && transactions.length === 0" class="fixed top-16 right-4 z-50 bg-[#0f1019] border border-[#1f202e] px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg backdrop-blur-md">
        <div class="w-3 h-3 border-2 border-[#D4BFFF] border-t-transparent rounded-full animate-spin"></div>
        <span class="text-[11px] font-semibold text-[#D4BFFF]">Syncing...</span>
      </div>

      <div>
        <Dashboard 
          v-show="currentTab === 'dashboard'" 
          :accounts="accounts"
          :transactions="dashboardTransactions"
          :categories="categories"
          :buckets="buckets"
          @add-transaction="openAddTransaction"
          @refresh="refreshAll"
        />

        <TransactionList 
          v-show="currentTab === 'transactions'"
          :transactions="transactions"
          :accounts="accounts"
          :categories="categories"
          :buckets="buckets"
          :summary="transactionSummary"
          @add-transaction="openAddTransaction"
          @edit-transaction="openEditTransaction"
          @edit-transaction-save="handleDirectSaveTransaction"
          @delete-transaction="handleDeleteTransaction"
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
          @transfer-accounts="handleTransferAccounts"
          @reorder-buckets="handleReorderBuckets"
          @reorder-categories="handleReorderCategories"
          @allocate-unassigned="handleAllocateUnassigned"
          @data-refresh="handleDataRefresh"
          @open-tutorial="openTutorial"
        />
      </div>
    </main>

    <!-- BottomNavBar -->
    <nav class="bg-[#0c0d14]/95 backdrop-blur-md border-t border-[#1f202e] fixed bottom-0 w-full z-40 flex justify-around items-center h-15 px-2 sm:hidden safe-area-pb">
      <button 
        @click="currentTab = 'dashboard'"
        class="relative flex flex-col items-center justify-center py-1.5 px-3.5 rounded-xl transition cursor-pointer min-w-[60px]"
        :class="currentTab === 'dashboard' ? 'text-[#D4BFFF] font-bold' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
      >
        <span v-if="currentTab === 'dashboard'" class="absolute inset-0 bg-[#D4BFFF]/10 border border-[#D4BFFF]/20 rounded-xl pointer-events-none transition-all duration-300"></span>
        <span class="material-symbols-outlined text-xl mb-0.5 relative z-10">dashboard</span>
        <span class="text-[10px] leading-none relative z-10">Home</span>
      </button>

      <button 
        @click="currentTab = 'transactions'"
        class="relative flex flex-col items-center justify-center py-1.5 px-3.5 rounded-xl transition cursor-pointer min-w-[60px]"
        :class="currentTab === 'transactions' ? 'text-[#D4BFFF] font-bold' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
      >
        <span v-if="currentTab === 'transactions'" class="absolute inset-0 bg-[#D4BFFF]/10 border border-[#D4BFFF]/20 rounded-xl pointer-events-none transition-all duration-300"></span>
        <span class="material-symbols-outlined text-xl mb-0.5 relative z-10">receipt_long</span>
        <span class="text-[10px] leading-none relative z-10">History</span>
      </button>

      <!-- Center Quick Log Action Button -->
      <button 
        data-tour="add-tx-btn-mobile"
        @click="openAddTransaction()"
        class="w-11 h-11 -mt-5 rounded-full bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer shrink-0 border-2 border-[#0f0f15]"
        title="Add Transaction"
      >
        <span class="material-symbols-outlined text-2xl leading-none font-bold">add</span>
      </button>

      <button 
        @click="currentTab = 'debts'"
        class="relative flex flex-col items-center justify-center py-1.5 px-3.5 rounded-xl transition cursor-pointer min-w-[60px]"
        :class="currentTab === 'debts' ? 'text-[#D4BFFF] font-bold' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
      >
        <span v-if="currentTab === 'debts'" class="absolute inset-0 bg-[#D4BFFF]/10 border border-[#D4BFFF]/20 rounded-xl pointer-events-none transition-all duration-300"></span>
        <span class="material-symbols-outlined text-xl mb-0.5 relative z-10">account_balance_wallet</span>
        <span class="text-[10px] leading-none relative z-10">Debts</span>
      </button>

      <button 
        @click="currentTab = 'settings'"
        class="relative flex flex-col items-center justify-center py-1.5 px-3.5 rounded-xl transition cursor-pointer min-w-[60px]"
        :class="currentTab === 'settings' ? 'text-[#D4BFFF] font-bold' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
      >
        <span v-if="currentTab === 'settings'" class="absolute inset-0 bg-[#D4BFFF]/10 border border-[#D4BFFF]/20 rounded-xl pointer-events-none transition-all duration-300"></span>
        <span class="material-symbols-outlined text-xl mb-0.5 relative z-10">widgets</span>
        <span class="text-[10px] leading-none relative z-10">More</span>
      </button>
    </nav>

    <!-- Slide-over / Modal Form -->
    <Transition name="modal">
      <TransactionForm 
        v-if="showForm" 
        :transaction="editingTransaction"
        :accounts="accounts"
        :categories="categories"
        :buckets="buckets"
        :default-bucket-id="selectedBucketForTx"
        :default-type="selectedTypeForTx"
        :initial-step="transactionFormStep"
        @close="showForm = false"
        @save="handleSaveTransaction"
      />
    </Transition>

    <!-- Multi-Vault Management Modal -->
    <VaultModal 
      :is-open="showVaultModal"
      :vaults="vaults"
      @close="showVaultModal = false"
      @switch-vault="handleSwitchVault"
      @create-vault="handleCreateVault"
      @import-vault="handleImportVault"
      @delete-vault="handleDeleteVault"
      @rename-vault="handleRenameVault"
    />

    <!-- Onboarding & Interactive App Tour Modal -->
    <OnboardingModal 
      :is-open="showOnboardingModal"
      :initial-stage="onboardingStage"
      @close="showOnboardingModal = false"
      @completed="refreshAll"
      @switch-tab="currentTab = $event"
      @open-form-step-1="openAddTransaction({ step: 1 })"
      @open-form-step-2="openAddTransaction({ step: 2 })"
      @close-form="showForm = false"
    />
  </div>
</template>
