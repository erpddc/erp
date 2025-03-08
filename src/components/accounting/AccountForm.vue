<template>
  <q-dialog v-model="show" persistent>
    <q-card style="min-width: 350px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ editMode ? 'Edit Account' : 'New Account' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input v-model="form.AC_CODE" label="Account Code" :disable="editMode"
            :rules="[val => !!val || 'Account code is required']" />

          <q-input v-model="form.AC_NAME" label="Account Name" :rules="[val => !!val || 'Account name is required']" />

          <q-select v-model="form.PARENT_ACCOUNT" :options="accountOptions" label="Parent Account"
            option-value="AC_CODE" option-label="AC_NAME" emit-value map-options />

          <q-select v-model="form.STATEMENT_TYPE" :options="[
            { label: 'Asset', value: 'A' },
            { label: 'Liability', value: 'L' },
            { label: 'Expense', value: 'E' },
            { label: 'Income', value: 'I' }
          ]" label="Statement Type" emit-value map-options :rules="[val => !!val || 'Statement type is required']" />

          <q-select v-model="form.AC_TYPE" :options="[
            { label: 'Node', value: 'N' },
            { label: 'Transaction', value: 'T' }
          ]" label="Account Type" emit-value map-options :rules="[val => !!val || 'Account type is required']" />

          <q-toggle v-model="form.IS_ACTIVE" label="Active" true-value="Y" false-value="N" />

          <div class="row justify-between q-gutter-sm">
            <q-btn v-if="editMode" label="Delete" color="negative" flat @click="confirmDelete" />
            <div class="row justify-end q-gutter-sm">
              <q-btn label="Cancel" color="grey" v-close-popup />
              <q-btn :label="editMode ? 'Update' : 'Create'" color="primary" type="submit" />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref, computed, watch } from 'vue';

const $q = useQuasar();

// Define the COA interface here since we can't import it
interface COA {
  PARENT_ACCOUNT: string | null
  AC_CODE: string
  AC_NAME: string
  AC_TYPE: 'N' | 'T'
  STATEMENT_TYPE: 'A' | 'L' | 'E' | 'I'
  IS_ACTIVE: 'Y' | 'N'
  TRANSACTION_TYPE: string
  OPENING_BALANCE: number
  children?: COA[]
}

const props = defineProps<{
  modelValue: boolean,
  accounts: COA[],
  editData?: COA | null
}>();

const emit = defineEmits(['update:modelValue', 'submit', 'delete']);

const show = ref(false);
const editMode = ref(false);

const defaultForm = {
  AC_CODE: '',
  AC_NAME: '',
  PARENT_ACCOUNT: null as string | null,
  AC_TYPE: 'N' as 'N' | 'T',
  STATEMENT_TYPE: 'A' as 'A' | 'L' | 'E' | 'I',
  IS_ACTIVE: 'Y' as 'Y' | 'N',
  TRANSACTION_TYPE: '',
  OPENING_BALANCE: 0
};

const form = ref({ ...defaultForm });

const accountOptions = computed(() => {
  return props.accounts.map(acc => ({
    label: `${acc.AC_CODE} - ${acc.AC_NAME}`,
    value: acc.AC_CODE
  }));
});

watch(() => props.modelValue, (newVal) => {
  show.value = newVal;
});

watch(() => show.value, (newVal) => {
  emit('update:modelValue', newVal);
  if (!newVal) {
    form.value = { ...defaultForm };
  }
});

watch(() => props.editData, (newVal) => {
  if (newVal) {
    editMode.value = true;
    form.value = { ...newVal };
  } else {
    editMode.value = false;
    form.value = { ...defaultForm };
  }
}, { immediate: true });

const onSubmit = () => {
  emit('submit', { ...form.value });
};

const confirmDelete = () => {
  $q.dialog({
    title: 'Confirm Deletion',
    message: `Are you sure you want to delete ${form.value.AC_NAME}?`,
    persistent: true,
    ok: {
      label: 'Delete',
      color: 'negative'
    },
    cancel: {
      label: 'Cancel',
      color: 'grey'
    }
  }).onOk(() => {
    emit('delete', form.value);
  });
};
</script>
