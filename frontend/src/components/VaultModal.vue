<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-6">
      
      <!-- Header -->
      <div class="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h3 class="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>🏦</span> Financial Vaults Management
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">Switch between isolated database vaults stored locally in your <code class="text-indigo-400 font-mono">data/</code> folder.</p>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-200 text-xl font-bold cursor-pointer">✕</button>
      </div>

      <!-- Create Vault Form -->
      <form @submit.prevent="handleCreate" class="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Create New Vault</p>
        <div class="flex gap-3">
          <input 
            v-model="newVaultName"
            type="text"
            placeholder="Vault Name (e.g. Freelance, Family, Business)"
            required
            class="flex-grow px-3.5 py-2 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 text-xs placeholder-slate-500 focus:outline-none transition"
          />
          <button 
            type="submit"
            :disabled="creating"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer disabled:opacity-50 shrink-0"
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
            class="p-3.5 flex items-center justify-between hover:bg-slate-950/40 transition"
            :class="{ 'bg-indigo-950/20 border-l-4 border-l-indigo-500': v.is_active }"
          >
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg shrink-0">
                {{ v.is_active ? '📂' : '📁' }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <p class="text-sm font-bold text-slate-200">{{ v.name }}</p>
                  <span v-if="v.is_active" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                    Active Vault
                  </span>
                </div>
                <p class="text-[10px] text-slate-400 mt-0.5">
                  <span class="font-mono text-slate-500">{{ v.filename }}</span> • {{ formatSize(v.size_bytes) }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
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
            accept=".db,.sqlite" 
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

const formatSize = (bytes) => {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};
</script>
