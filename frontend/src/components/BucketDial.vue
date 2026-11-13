<template>
  <div>
    <button
      type="button"
      class="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[#29293a] bg-[#0f1019] text-[#D4BFFF] transition hover:border-[#D4BFFF]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4BFFF]"
      aria-label="Choose starting balance buckets"
      title="Choose starting balance buckets"
      :aria-expanded="isOpen"
      @click="toggleOpen"
    >
      <span class="material-symbols-outlined text-xl">savings</span>
    </button>

    <Transition name="bucket-dial">
      <div v-if="isOpen" class="dial-overlay fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-3 sm:items-center" @click.self="toggleOpen">
        <section
          class="dial-panel max-h-full w-full max-w-sm overflow-y-auto rounded-t-3xl border border-[#29293a] bg-[#14141d] p-4 sm:rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bucket-dial-title"
          @keydown.esc.stop.prevent="toggleOpen"
        >
          <header class="mb-2 flex items-center justify-between gap-3">
            <div>
              <h3 id="bucket-dial-title" class="text-sm font-bold text-[#f1f0f5]">Starting balance buckets</h3>
              <p class="mt-0.5 text-[10px] text-[#9e9cae]">Choose buckets to include in your starting amount.</p>
            </div>
            <button type="button" class="min-h-11 min-w-11 rounded-full text-[#9e9cae] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4BFFF]" aria-label="Close bucket selector" @click="toggleOpen">
              <span class="material-symbols-outlined">close</span>
            </button>
          </header>

          <p v-if="buckets.length" class="mb-2 text-center text-[11px] text-[#9e9cae]">Swipe or drag around the dial, or use the arrows.</p>
          <div
            v-if="buckets.length"
            class="dial-stage mx-auto"
            role="group"
            aria-label="Savings buckets dial"
            tabindex="0"
            @pointerdown="startDrag"
            @pointerup="endDrag"
            @pointercancel="endDrag"
            @keydown.left.prevent="moveSelection(-1)"
            @keydown.right.prevent="moveSelection(1)"
          >
            <div class="dial-ring" aria-hidden="true"></div>
            <button
              v-for="(bucket, index) in buckets"
              :key="bucket.id"
              type="button"
              class="dial-node focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4BFFF]"
              :class="index === selectedIndex ? 'dial-node-selected' : ''"
              :style="nodeStyle(index)"
              :aria-pressed="index === selectedIndex"
              :aria-label="bucketLabel(bucket)"
              @click="selectBucket(index)"
            >
              <span class="material-symbols-outlined" :style="{ color: bucket.color || '#D4BFFF' }">{{ resolveIcon(bucket.icon, 'bucket') }}</span>
              <span class="dial-node-name">{{ bucket.name }}</span>
              <span class="dial-node-amount">{{ currencySymbol }}{{ formatAmount(bucket.allocated_balance) }}</span>
            </button>

            <div class="dial-center" aria-live="polite">
              <template v-if="selectedBucket">
                <span class="dial-center-name">{{ selectedBucket.name }}</span>
                <span class="dial-center-amount">{{ currencySymbol }}{{ formatAmount(selectedBucket.allocated_balance) }}</span>
                <button type="button" class="dial-add" :disabled="isIncluded(selectedBucket)" @click="emit('add-to-starting-balance', selectedBucket)">
                  {{ isIncluded(selectedBucket) ? 'Already included' : 'Use in starting balance' }}
                </button>
              </template>
              <span v-else class="text-xs text-[#9e9cae]">No active buckets</span>
            </div>
          </div>
          <div v-else class="rounded-xl border border-dashed border-[#29293a] p-6 text-center text-sm text-[#9e9cae]">
            Create a savings bucket to add its balance here.
          </div>

          <div v-if="buckets.length > 1" class="mt-2 flex items-center justify-center gap-3">
            <button type="button" class="dial-nav" aria-label="Previous bucket" @click="moveSelection(-1)">
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <span class="min-w-16 text-center text-xs tabular-nums text-[#9e9cae]">{{ selectedIndex + 1 }} / {{ buckets.length }}</span>
            <button type="button" class="dial-nav" aria-label="Next bucket" @click="moveSelection(1)">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          <div v-if="includedBuckets.length" class="mt-3 border-t border-[#29293a] pt-3">
            <p class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#9e9cae]">Included in starting balance</p>
            <div v-for="bucket in includedBuckets" :key="bucket.id" class="flex min-h-11 items-center justify-between gap-2">
              <span class="min-w-0 truncate text-xs text-[#f1f0f5]">{{ bucket.name }}</span>
              <div class="flex shrink-0 items-center gap-2">
                <span class="text-xs tabular-nums text-[#B3F5E1]">{{ currencySymbol }}{{ formatAmount(bucket.amount) }}</span>
                <button type="button" class="min-h-11 min-w-11 rounded-lg text-xs text-[#ffb4ab] hover:bg-[#ffb4ab]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb4ab]" :aria-label="'Remove ' + bucket.name + ' from starting balance'" @click="emit('remove-from-starting-balance', bucket.id)">×</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { resolveIcon } from '../utils/iconResolver.js';
import { currencySymbol } from '../utils/currency.js';

const props = defineProps({
  buckets: { type: Array, default: () => [] },
  includedBuckets: { type: Array, default: () => [] }
});
const emit = defineEmits(['add-to-starting-balance', 'remove-from-starting-balance']);
const isOpen = ref(false);
const selectedIndex = ref(0);
const dragStart = ref(null);
const didDrag = ref(false);

const buckets = computed(() => props.buckets.filter(bucket => !bucket.is_archived));
const selectedBucket = computed(() => buckets.value[selectedIndex.value] || null);
const nodeSize = computed(() => Math.max(46, 68 - Math.max(0, buckets.value.length - 6) * 3));
const dialRadius = computed(() => Math.min(126, 88 + Math.max(0, buckets.value.length - 4) * 4));

watch(buckets, () => {
  if (selectedIndex.value >= buckets.value.length) selectedIndex.value = Math.max(0, buckets.value.length - 1);
});

function toggleOpen() {
  isOpen.value = !isOpen.value;
}

function closeIfOpen() {
  if (!isOpen.value) return false;
  isOpen.value = false;
  return true;
}

defineExpose({ closeIfOpen });

function formatAmount(value) {
  return (Number(value) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function bucketLabel(bucket) {
  return bucket.name + ', ' + currencySymbol.value + formatAmount(bucket.allocated_balance);
}

function isIncluded(bucket) {
  return props.includedBuckets.some(item => item.id === bucket.id);
}

function nodeStyle(index) {
  const step = 360 / Math.max(1, buckets.value.length);
  const angle = index * step - selectedIndex.value * step;
  return {
    width: nodeSize.value + 'px',
    height: nodeSize.value + 'px',
    transform: 'translate(-50%, -50%) rotate(' + angle + 'deg) translateY(-' + dialRadius.value + 'px) rotate(' + -angle + 'deg)'
  };
}

function selectBucket(index) {
  if (didDrag.value) {
    didDrag.value = false;
    return;
  }
  selectedIndex.value = index;
}

function moveSelection(direction) {
  const count = buckets.value.length;
  if (!count) return;
  selectedIndex.value = (selectedIndex.value + direction + count) % count;
}

function startDrag(event) {
  dragStart.value = event.clientX;
  didDrag.value = false;
}

function endDrag(event) {
  if (dragStart.value === null) return;
  const delta = dragStart.value - event.clientX;
  const steps = Math.round(delta / 42);
  if (Math.abs(delta) >= 18) {
    moveSelection(steps || Math.sign(delta));
    didDrag.value = true;
    setTimeout(() => { didDrag.value = false; }, 0);
  }
  dragStart.value = null;
}
</script>

<style scoped>
.dial-stage {
  position: relative;
  width: min(100%, 330px);
  aspect-ratio: 1;
  touch-action: pan-y;
  user-select: none;
}
.dial-stage:focus-visible { outline: 2px solid #D4BFFF; outline-offset: 3px; border-radius: 50%; }
.dial-ring {
  position: absolute;
  inset: 12%;
  border: 1px dashed #29293a;
  border-radius: 50%;
}
.dial-node {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  border: 1px solid #29293a;
  border-radius: 50%;
  background: #14141d;
  padding: 4px;
  color: #f1f0f5;
  transition: transform 240ms cubic-bezier(.2,.8,.2,1), border-color 180ms ease, background 180ms ease, scale 180ms ease;
  cursor: pointer;
}
.dial-node-selected {
  z-index: 1;
  border-color: #D4BFFF;
  background: #232332;
  scale: 1.07;
}
.dial-node .material-symbols-outlined { font-size: 15px; line-height: 1; }
.dial-node-name, .dial-node-amount { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.15; }
.dial-node-name { font-size: 10px; color: #d8d6e0; }
.dial-node-amount { font-size: 9px; color: #9e9cae; font-variant-numeric: tabular-nums; }
.dial-center {
  position: absolute;
  inset: 50% auto auto 50%;
  display: flex;
  width: 42%;
  min-height: 76px;
  transform: translate(-50%, -50%);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  text-align: center;
}
.dial-center-name { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; font-weight: 700; color: #f1f0f5; }
.dial-center-amount { font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; color: #D4BFFF; }
.dial-add, .dial-nav {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid #D4BFFF;
  border-radius: 999px;
  background: #D4BFFF;
  padding: 0 12px;
  font-size: 10px;
  font-weight: 700;
  color: #0f0f15;
}
.dial-add:focus-visible, .dial-nav:focus-visible { outline: 2px solid white; outline-offset: 2px; }
.dial-nav { width: 44px; height: 44px; border-color: #29293a; background: #14141d; color: #D4BFFF; }
.dial-nav .material-symbols-outlined { font-size: 20px; }
.dial-overlay { padding-top: max(12px, env(safe-area-inset-top)); padding-bottom: max(12px, env(safe-area-inset-bottom)); }
.bucket-dial-enter-active, .bucket-dial-leave-active { transition: opacity 180ms ease; }
.bucket-dial-enter-active .dial-panel, .bucket-dial-leave-active .dial-panel { transition: transform 220ms cubic-bezier(.2,.8,.2,1); }
.bucket-dial-enter-from, .bucket-dial-leave-to { opacity: 0; }
.bucket-dial-enter-from .dial-panel, .bucket-dial-leave-to .dial-panel { transform: translateY(14px) scale(.98); }
.dial-add:disabled { cursor: default; opacity: .5; }
@media (prefers-reduced-motion: reduce) {
  .dial-node, .bucket-dial-enter-active, .bucket-dial-leave-active { transition-duration: 0.01ms; }
}
</style>
