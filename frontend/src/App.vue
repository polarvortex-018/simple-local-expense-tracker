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
  <div class="min-h-screen flex flex-col bg-[#0b1326] text-slate-100">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="successMessage"
        class="pointer-events-none fixed top-[max(2.5rem,calc(env(safe-area-inset-top)+1rem))] left-1/2 z-[80] -translate-x-1/2 rounded-full border border-emerald-500/40 bg-emerald-950/95 px-4 py-2.5 text-xs font-bold text-emerald-200 shadow-2xl backdrop-blur-lg"
        role="status"
        aria-live="polite"
      >
        ✓ {{ successMessage }}
      </div>
    </Transition>    <!-- Navbar / TopAppBar -->
    <header class="bg-[#0f0f15] border-b border-[#29293a] sticky top-0 z-40 safe-area-pt">
      <div class="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <img src="/cashbuddy-logo.svg" alt="Cash Buddy Logo" class="w-8 h-8 object-contain" />
          <div class="flex flex-col">
            <span class="font-extrabold text-[#D4BFFF] tracking-tight text-lg leading-tight">Cash Buddy</span>
          </div>
          
          <!-- Vault Switcher Icon-Only Trigger (Option C) -->
          <button 
            @click="showVaultModal = true"
            class="ml-1 px-2 py-1 bg-[#14141d] hover:bg-[#191924] border border-[#29293a] hover:border-[#D4BFFF] rounded-full text-xs font-semibold text-[#f1f0f5] flex items-center gap-1 transition cursor-pointer shadow-sm"
            :title="`Active Vault: ${activeVaultName}. Click to switch database.`"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-[#B3F5E1]"></span>
            <span>🏦</span>
            <span class="text-[9px] text-[#9e9cae]">▾</span>
          </button>
        </div>

        <!-- Desktop Navigation Tabs -->
        <nav class="hidden sm:flex gap-1 bg-[#14141d] p-1 rounded-xl border border-[#29293a]">
          <button 
            @click="currentTab = 'dashboard'"
            class="px-3.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
            :class="currentTab === 'dashboard' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
              <rect width="7" height="9" x="3" y="3" rx="1" :fill="currentTab === 'dashboard' ? 'currentColor' : 'none'" />
              <rect width="7" height="5" x="14" y="3" rx="1" :fill="currentTab === 'dashboard' ? 'currentColor' : 'none'" />
              <rect width="7" height="9" x="14" y="12" rx="1" :fill="currentTab === 'dashboard' ? 'currentColor' : 'none'" />
              <rect width="7" height="5" x="3" y="16" rx="1" :fill="currentTab === 'dashboard' ? 'currentColor' : 'none'" />
            </svg>
            <span>Dashboard</span>
          </button>
          <button 
            @click="currentTab = 'transactions'"
            class="px-3.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
            :class="currentTab === 'transactions' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
              <path d="M16 8H8" />
              <path d="M16 12H8" />
              <path d="M13 16H8" />
            </svg>
            <span>Transactions</span>
          </button>
          <button 
            @click="currentTab = 'debts'"
            class="px-3.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
            :class="currentTab === 'debts' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
              <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9" :fill="currentTab === 'debts' ? 'currentColor' : 'none'" />
              <path d="M16 14h.01" />
            </svg>
            <span>Debt List</span>
          </button>
          <button 
            @click="currentTab = 'settings'"
            class="px-3.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
            :class="currentTab === 'settings' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" :fill="currentTab === 'settings' ? 'currentColor' : 'none'" />
            </svg>
            <span>Settings</span>
          </button>
        </nav>
      </div>
    </header>

    <!-- Main Content Container with Bottom Padding for Mobile Nav Bar -->
    <main class="flex-grow max-w-6xl w-full mx-auto px-3 md:px-6 py-4 pb-28 sm:pb-8">
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
        />
      </div>
    </main>

    <!-- BottomNavBar (Material 3 Dark Pastel Theme) -->
    <nav class="bg-[#14141d] border-t border-[#29293a] fixed bottom-0 w-full z-40 flex justify-around items-center min-h-[64px] px-4 md:hidden safe-area-pb">
      <button 
        @click="currentTab = 'dashboard'"
        class="flex flex-col items-center justify-center font-bold text-xs active:scale-95 transition-transform duration-150 cursor-pointer"
        :class="currentTab === 'dashboard' ? 'bg-[#D4BFFF] text-[#0f0f15] rounded-xl px-3.5 py-1 shadow-sm' : 'text-[#9e9cae] hover:text-[#D4BFFF]'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 mb-0.5">
          <rect width="7" height="9" x="3" y="3" rx="1" :fill="currentTab === 'dashboard' ? 'currentColor' : 'none'" />
          <rect width="7" height="5" x="14" y="3" rx="1" :fill="currentTab === 'dashboard' ? 'currentColor' : 'none'" />
          <rect width="7" height="9" x="14" y="12" rx="1" :fill="currentTab === 'dashboard' ? 'currentColor' : 'none'" />
          <rect width="7" height="5" x="3" y="16" rx="1" :fill="currentTab === 'dashboard' ? 'currentColor' : 'none'" />
        </svg>
        <span>Home</span>
      </button>

      <button 
        @click="currentTab = 'transactions'"
        class="flex flex-col items-center justify-center font-bold text-xs active:scale-95 transition-transform duration-150 cursor-pointer"
        :class="currentTab === 'transactions' ? 'bg-[#D4BFFF] text-[#0f0f15] rounded-xl px-3.5 py-1 shadow-sm' : 'text-[#9e9cae] hover:text-[#D4BFFF]'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 mb-0.5">
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
          <path d="M16 8H8" />
          <path d="M16 12H8" />
          <path d="M13 16H8" />
        </svg>
        <span>History</span>
      </button>

      <!-- Quick Log Action Button -->
      <button 
        @click="openAddTransaction()"
        class="w-11 h-11 -mt-4 rounded-full bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] flex items-center justify-center font-black text-lg shadow-lg border-2 border-[#0f0f15] transition active:scale-95 cursor-pointer shrink-0"
        title="Add Transaction"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      </button>

      <button 
        @click="currentTab = 'debts'"
        class="flex flex-col items-center justify-center font-bold text-xs active:scale-95 transition-transform duration-150 cursor-pointer"
        :class="currentTab === 'debts' ? 'bg-[#D4BFFF] text-[#0f0f15] rounded-xl px-3.5 py-1 shadow-sm' : 'text-[#9e9cae] hover:text-[#D4BFFF]'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 mb-0.5">
          <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9" :fill="currentTab === 'debts' ? 'currentColor' : 'none'" />
          <path d="M16 14h.01" />
        </svg>
        <span>Debt</span>
      </button>

      <button 
        @click="currentTab = 'settings'"
        class="flex flex-col items-center justify-center font-bold text-xs active:scale-95 transition-transform duration-150 cursor-pointer"
        :class="currentTab === 'settings' ? 'bg-[#D4BFFF] text-[#0f0f15] rounded-xl px-3.5 py-1 shadow-sm' : 'text-[#9e9cae] hover:text-[#D4BFFF]'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 mb-0.5">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" :fill="currentTab === 'settings' ? 'currentColor' : 'none'" />
        </svg>
        <span>Settings</span>
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
  </div>
</template>
