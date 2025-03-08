<template>
  <q-page class="q-pa-md">
    <q-inner-loading :showing="loading">
      <q-spinner-dots size="50px" color="primary" />
    </q-inner-loading>

    <div class="row q-col-gutter-md q-mb-md">
      <!-- Search and Filters -->
      <div class="col-12 col-md-8">
        <div class="row q-col-gutter-sm">
          <div class="col">
            <q-input v-model="search" outlined dense placeholder="Search accounts..." clearable @clear="onSearchClear">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-auto">
            <q-btn-group flat>
              <q-btn :color="selectedType === 'A' ? 'primary' : 'grey'" label="Assets" @click="filterByType('A')" />
              <q-btn :color="selectedType === 'L' ? 'primary' : 'grey'" label="Liabilities"
                @click="filterByType('L')" />
              <q-btn :color="selectedType === 'E' ? 'primary' : 'grey'" label="Expenses" @click="filterByType('E')" />
              <q-btn :color="selectedType === 'I' ? 'primary' : 'grey'" label="Income" @click="filterByType('I')" />
            </q-btn-group>
          </div>
          <div class="col-auto">
            <q-btn-group flat>
              <q-btn icon="unfold_less" @click="collapseAll" />
              <q-btn icon="unfold_more" @click="expandAll" />
            </q-btn-group>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="col-12 col-md-4 text-right">
        <q-btn color="primary" icon="add" label="New Account" @click="openModal()" />
      </div>
    </div>

    <!-- Tree View -->
    <q-tree :nodes="filteredAccounts" node-key="AC_CODE" v-model:expanded="expanded" default-expand-all>
      <template v-slot:default-header="prop">
        <div class="row items-center">
          <div class="text-weight-bold" :class="getAccountTypeColor(prop.node.AC_TYPE)">
            {{ prop.node.AC_CODE }}
          </div>
          <div class="q-ml-sm name-container">
            {{ prop.node.AC_NAME }}
            <q-btn flat round dense icon="edit" size="sm" @click.stop="openModal(prop.node)" class="edit-button" />
          </div>
          <q-chip v-if="prop.node.AC_TYPE === 'T'" dense size="sm" class="q-ml-sm">
            Transaction
          </q-chip>
          <q-chip v-if="prop.node.IS_ACTIVE === 'N'" dense size="sm" color="negative" class="q-ml-sm">
            Inactive
          </q-chip>
        </div>
      </template>
    </q-tree>

    <AccountForm v-model="showModal" :accounts="accounts" :edit-data="editingAccount" @submit="handleAccountSubmit"
      @delete="handleAccountDelete" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from 'src/boot/supabase'
import { useQuasar } from 'quasar'
import AccountForm from 'src/components/accounting/AccountForm.vue'
import type { COA } from 'src/models/COA'

const $q = useQuasar()

// State
const accounts = ref<COA[]>([])
const search = ref('')
const selectedType = ref('')
const expanded = ref<string[]>([])
const loading = ref(false)
const showModal = ref(false)
const editingAccount = ref<COA | null>(null)

// Updated buildTree function with better error handling
const buildTree = (items: COA[]): COA[] => {
  try {
    const itemMap = new Map<string, COA>()
    const roots: COA[] = []

    // First pass: Create map of items with empty children arrays
    items.forEach((item) => {
      itemMap.set(item.AC_CODE, { ...item, children: [] })
    })

    // Second pass: Build tree structure
    items.forEach((item) => {
      const node = itemMap.get(item.AC_CODE)
      if (!node) return // Skip if node not found

      if (item.PARENT_ACCOUNT) {
        const parent = itemMap.get(item.PARENT_ACCOUNT)
        if (parent && parent.children) {
          parent.children.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    // Sort roots by SORT field if available
    return roots.sort((a, b) => (a.SORT || 0) - (b.SORT || 0))
  } catch (err) {
    console.error('Error building tree:', err)
    return []
  }
}

// Updated fetchAccounts with better error handling and logging
const fetchAccounts = async () => {
  try {
    loading.value = true
    console.log('Fetching accounts...')

    const { data, error } = await supabase
      .from('COA')
      .select('*')
      .order('SORT', { ascending: true })

    if (error) throw error

    if (!data || data.length === 0) {
      console.log('No accounts found')
      accounts.value = []
      return
    }

    console.log(`Fetched ${data.length} accounts`)
    accounts.value = data
  } catch (err) {
    console.error('Error fetching accounts:', err)
    $q.notify({
      type: 'negative',
      message: 'Failed to load chart of accounts',
    })
    accounts.value = []
  } finally {
    loading.value = false
  }
}

const searchInTree = (items: COA[], searchText: string): COA[] => {
  return items.reduce((filtered: COA[], item) => {
    const matchesSearch =
      item.AC_CODE.toLowerCase().includes(searchText.toLowerCase()) ||
      item.AC_NAME.toLowerCase().includes(searchText.toLowerCase());

    if (matchesSearch) {
      // If item matches, include it
      filtered.push(item);
    } else if (item.children && item.children.length) {
      // If children match, include parent with matching children
      const matchingChildren = searchInTree(item.children, searchText);
      if (matchingChildren.length) {
        filtered.push({ ...item, children: matchingChildren });
      }
    }
    return filtered;
  }, []);
};

// Replace the existing filteredAccounts computed property
const filteredAccounts = computed(() => {
  try {
    let filtered = [...accounts.value];

    // Apply type filter
    if (selectedType.value) {
      filtered = filtered.filter((account) => account.STATEMENT_TYPE === selectedType.value);
    }

    // Build tree first
    let tree = buildTree(filtered);

    // Then apply search filter if needed
    if (search.value) {
      tree = searchInTree(tree, search.value);
    }

    return tree;
  } catch (err) {
    console.error('Error in filteredAccounts:', err);
    return [];
  }
});

// Methods
const filterByType = (type: string) => {
  selectedType.value = selectedType.value === type ? '' : type
}

const onSearchClear = () => {
  search.value = ''
}

const expandAll = () => {
  expanded.value = accounts.value.map((account) => account.AC_CODE)
}

const collapseAll = () => {
  expanded.value = []
}

const getAccountTypeColor = (type: string) => {
  switch (type) {
    case 'A':
      return 'text-positive'
    case 'L':
      return 'text-negative'
    case 'E':
      return 'text-warning'
    case 'I':
      return 'text-info'
    default:
      return ''
  }
}

const openModal = (account?: COA) => {
  editingAccount.value = account || null;
  showModal.value = true;
}

const handleAccountSubmit = async (formData: COA) => {
  try {
    // Remove children field before submitting
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { children, ...submitData } = formData;

    if (editingAccount.value) {
      const { error } = await supabase
        .from('COA')
        .update(submitData)
        .eq('AC_CODE', submitData.AC_CODE);

      if (error) throw error;
      $q.notify({ type: 'positive', message: 'Account updated successfully' });
    } else {
      const { error } = await supabase
        .from('COA')
        .insert(submitData);

      if (error) throw error;
      $q.notify({ type: 'positive', message: 'Account created successfully' });
    }

    showModal.value = false;
    await fetchAccounts();
  } catch (err) {
    console.error('Error saving account:', err);
    $q.notify({ type: 'negative', message: 'Failed to save account' });
  }
}

const handleAccountDelete = async (account: COA) => {
  try {
    const { error } = await supabase
      .from('COA')
      .delete()
      .eq('AC_CODE', account.AC_CODE);

    if (error) throw error;

    $q.notify({ type: 'positive', message: 'Account deleted successfully' });
    showModal.value = false;
    await fetchAccounts();
  } catch (err) {
    console.error('Error deleting account:', err);
    $q.notify({ type: 'negative', message: 'Failed to delete account' });
  }
};

// Lifecycle
onMounted(async () => {
  await fetchAccounts()
})
</script>

<style lang="scss" scoped>
.q-tree__node-header {
  padding: 4px;

  &:hover {
    background: rgba(0, 0, 0, 0.03);
  }

  .name-container {
    position: relative;
    display: inline-flex;
    align-items: center;

    .edit-button {
      opacity: 0;
      transition: opacity 0.3s;
      margin-left: 4px;
    }
  }

  &:hover .edit-button {
    opacity: 1;
  }
}
</style>
