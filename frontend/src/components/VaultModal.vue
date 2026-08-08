<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 pt-3 sm:pt-10 bg-slate-950/80 backdrop-blur-sm">
    <div class="bg-[#131b2e] border border-[#31394d] rounded-2xl w-full max-w-xl p-5 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto safe-area-pb">
      
      <!-- Header -->
      <div class="flex justify-between items-center border-b border-[#31394d] pb-3">
        <div>
          <h3 class="text-base font-bold text-slate-100 flex items-center gap-2 tracking-tight">
            <span>🏦</span> Financial Vaults Management
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">Switch between isolated database vaults stored locally.</p>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-200 text-lg font-bold cursor-pointer">✕</button>
      </div>

      <!-- Create Vault Form -->
      <form @submit.prevent="handleCreate" class="p-3.5 bg-[#0b1326] border border-[#31394d] rounded-lg space-y-2.5">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Create New Vault</p>
        <div class="flex gap-2">
          <input 
            v-model="newVaultName"
            type="text"
            placeholder="Vault Name (e.g. Freelance, Family, Business)"
            required
            class="flex-grow px-3 py-1.5 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-md text-slate-100 text-xs placeholder-slate-500 focus:outline-none transition"
          />
          <button 
            type="submit"
            :disabled="creating"
            class="px-4 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-full transition cursor-pointer disabled:opacity-50 shrink-0 shadow-sm"
          >
            {{ creating ? 'Creating...' : '+ Create Vault' }}
          </button>
        </div>
      </form>

      <!-- Vaults List -->
      <div class="space-y-3">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available Vaults</p>
        
        <div class="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20 max-h-60 overflow-y-auto">
          <div 
            v-for="v in vaults" 
            :key="v.filename"
            class="p-3.5 flex items-center justify-between hover:bg-slate-950/40 transition gap-3"
            :class="{ 'bg-indigo-950/20 border-l-4 border-l-indigo-500': v.is_active }"
          >
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg shrink-0">
                {{ v.is_active ? '📂' : '📁' }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <p class="text-sm font-bold text-slate-200 truncate max-w-[180px] sm:max-w-[240px]" :title="v.name">{{ v.name }}</p>
                  <span v-if="v.is_active" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40 shrink-0">
                    Active Vault
                  </span>
                </div>
                <p class="text-[10px] text-slate-400 mt-0.5 truncate">
                  <span class="font-mono text-slate-500 truncate inline-block max-w-[160px] sm:max-w-[220px] align-bottom" :title="v.filename">{{ v.filename }}</span> • {{ formatSize(v.size_bytes) }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0 ml-2">
              <button 
                @click="handleSaveVaultToFolder(v.filename)"
                class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition cursor-pointer flex items-center gap-1"
                title="Save database file directly to a custom folder on your computer/phone"
              >
                <span>💾 Save To...</span>
              </button>

              <button 
                v-if="!v.is_active"
                @click="$emit('switch-vault', v.filename)"
                class="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white font-semibold text-xs rounded-lg transition cursor-pointer"
              >
                Switch
              </button>

              <button 
                v-if="!v.is_active"
                @click="$emit('delete-vault', v.filename)"
                class="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                title="Delete Vault"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Import External Vault File -->
      <div class="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl space-y-2">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Import Existing Vault (.db)</p>
        <div class="flex items-center gap-3">
          <input 
            type="file" 
            ref="fileInput" 
              accept=".db,.sqlite,.cbbak"
            class="hidden" 
            @change="handleFileSelected"
          />
          <button 
            type="button" 
            @click="$refs.fileInput.click()" 
            class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Choose .db File
          </button>
          <span class="text-xs text-slate-400 truncate">{{ selectedFileName || 'No file chosen' }}</span>
          <button 
            v-if="selectedFile" 
            type="button" 
            @click="handleImport" 
            class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer ml-auto shrink-0"
          >
            Import Vault
          </button>
        </div>
      </div>

      <div class="flex justify-end pt-2">
        <button 
          @click="$emit('close')" 
          class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer"
        >
          Close
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  vaults: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'switch-vault', 'create-vault', 'import-vault', 'delete-vault']);

const newVaultName = ref('');
const creating = ref(false);

const selectedFile = ref(null);
const selectedFileName = ref('');
const fileInput = ref(null);

const handleCreate = async () => {
  if (!newVaultName.value.trim()) return;
  creating.value = true;
  try {
    emit('create-vault', newVaultName.value.trim());
    newVaultName.value = '';
  } finally {
    creating.value = false;
  }
};

const handleFileSelected = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    selectedFileName.value = file.name;
  }
};

const handleImport = () => {
  if (selectedFile.value) {
    emit('import-vault', selectedFile.value);
    selectedFile.value = null;
    selectedFileName.value = '';
  }
};

import { api } from '../services/api';

const handleSaveVaultToFolder = async (filename) => {
  try {
    await api.shareBackupFile(filename);
  } catch (err) {
    alert(err.message || 'Failed to save vault file.');
  }
};

const formatSize = (bytes) => {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};
</script>
