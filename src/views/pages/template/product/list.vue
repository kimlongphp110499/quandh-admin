<script setup lang="ts">
const widgetData = ref([
  { title: 'In-Store Sales', value: '$5,345', icon: 'tabler-smart-home', desc: '5k orders', change: 5.7 },
  { title: 'Website Sales', value: '$674,347', icon: 'tabler-device-laptop', desc: '21k orders', change: 12.4 },
  { title: 'Discount', value: '$14,235', icon: 'tabler-gift', desc: '6k orders' },
  { title: 'Affiliate', value: '$8,345', icon: 'tabler-wallet', desc: '150 orders', change: -3.5 },
])

const headers = [
  { title: 'Product', key: 'product' },
  { title: 'Category', key: 'category' },
  { title: 'Stock', key: 'stock', sortable: false },
  { title: 'SKU', key: 'sku' },
  { title: 'Price', key: 'price' },
  { title: 'QTY', key: 'qty' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const selectedStatus = ref()
const selectedCategory = ref()
const selectedStock = ref<boolean | undefined>()
const searchQuery = ref('')
const selectedRows = ref([])

const status = ref([
  { title: 'Scheduled', value: 'Scheduled' },
  { title: 'Publish', value: 'Published' },
  { title: 'Inactive', value: 'Inactive' },
])

const categories = ref([
  { title: 'Accessories', value: 'Accessories' },
  { title: 'Home Decor', value: 'Home Decor' },
  { title: 'Electronics', value: 'Electronics' },
  { title: 'Shoes', value: 'Shoes' },
  { title: 'Office', value: 'Office' },
  { title: 'Games', value: 'Games' },
])

const stockStatus = ref([
  { title: 'In Stock', value: true },
  { title: 'Out of Stock', value: false },
])

// Data table options
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

// Update data table options
const updateOptions = (options: any) => {
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}

const resolveCategory = (category: string) => {
  if (category === 'Accessories')
    return { color: 'error', icon: 'tabler-device-watch' }
  if (category === 'Home Decor')
    return { color: 'info', icon: 'tabler-home' }
  if (category === 'Electronics')
    return { color: 'primary', icon: 'tabler-device-imac' }
  if (category === 'Shoes')
    return { color: 'success', icon: 'tabler-shoe' }
  if (category === 'Office')
    return { color: 'warning', icon: 'tabler-briefcase' }
  if (category === 'Games')
    return { color: 'primary', icon: 'tabler-device-gamepad-2' }
}

const resolveStatus = (statusMsg: string) => {
  if (statusMsg === 'Scheduled')
    return { text: 'Scheduled', color: 'warning' }
  if (statusMsg === 'Published')
    return { text: 'Publish', color: 'success' }
  if (statusMsg === 'Inactive')
    return { text: 'Inactive', color: 'error' }
}

interface Product {
  id: number
  productName: string
  productBrand: string
  image: string
  category: string
  stock: boolean
  sku: string
  price: string
  qty: number
  status: string
}

const allProducts = ref<Product[]>([
  { id: 1, productName: 'iPhone 15 Pro', productBrand: 'Apple', image: 'https://picsum.photos/seed/iphone/38', category: 'Electronics', stock: true, sku: 'APL-IP15P', price: '$999', qty: 120, status: 'Published' },
  { id: 2, productName: 'MacBook Air M2', productBrand: 'Apple', image: 'https://picsum.photos/seed/macbook/38', category: 'Electronics', stock: true, sku: 'APL-MBA-M2', price: '$1,199', qty: 45, status: 'Published' },
  { id: 3, productName: 'Nike Air Max 270', productBrand: 'Nike', image: 'https://picsum.photos/seed/nike/38', category: 'Shoes', stock: true, sku: 'NK-AM270', price: '$150', qty: 200, status: 'Published' },
  { id: 4, productName: 'Adidas Ultraboost 23', productBrand: 'Adidas', image: 'https://picsum.photos/seed/adidas/38', category: 'Shoes', stock: false, sku: 'AD-UB23', price: '$180', qty: 0, status: 'Inactive' },
  { id: 5, productName: 'Samsung 4K Smart TV 55"', productBrand: 'Samsung', image: 'https://picsum.photos/seed/samsung/38', category: 'Electronics', stock: true, sku: 'SAM-TV55', price: '$799', qty: 30, status: 'Published' },
  { id: 6, productName: 'Leather Office Chair', productBrand: 'ErgoMax', image: 'https://picsum.photos/seed/chair/38', category: 'Office', stock: true, sku: 'EGM-LC01', price: '$350', qty: 60, status: 'Scheduled' },
  { id: 7, productName: 'Standing Desk Pro', productBrand: 'FlexDesk', image: 'https://picsum.photos/seed/desk/38', category: 'Office', stock: false, sku: 'FLX-SD01', price: '$499', qty: 0, status: 'Inactive' },
  { id: 8, productName: 'Apple Watch Series 9', productBrand: 'Apple', image: 'https://picsum.photos/seed/watch/38', category: 'Accessories', stock: true, sku: 'APL-WS9', price: '$399', qty: 85, status: 'Published' },
  { id: 9, productName: 'Sony WH-1000XM5', productBrand: 'Sony', image: 'https://picsum.photos/seed/headphone/38', category: 'Accessories', stock: true, sku: 'SNY-WH5', price: '$349', qty: 75, status: 'Published' },
  { id: 10, productName: 'Minimalist Wall Clock', productBrand: 'DecoHome', image: 'https://picsum.photos/seed/clock/38', category: 'Home Decor', stock: true, sku: 'DCH-WC01', price: '$45', qty: 300, status: 'Published' },
  { id: 11, productName: 'PlayStation 5', productBrand: 'Sony', image: 'https://picsum.photos/seed/ps5/38', category: 'Games', stock: false, sku: 'SNY-PS5', price: '$499', qty: 0, status: 'Inactive' },
  { id: 12, productName: 'Xbox Series X', productBrand: 'Microsoft', image: 'https://picsum.photos/seed/xbox/38', category: 'Games', stock: true, sku: 'MSF-XSX', price: '$499', qty: 25, status: 'Scheduled' },
  { id: 13, productName: 'Boho Throw Pillow Set', productBrand: 'CozyNest', image: 'https://picsum.photos/seed/pillow/38', category: 'Home Decor', stock: true, sku: 'CNS-TP01', price: '$35', qty: 500, status: 'Published' },
  { id: 14, productName: 'Logitech MX Master 3', productBrand: 'Logitech', image: 'https://picsum.photos/seed/mouse/38', category: 'Accessories', stock: true, sku: 'LGT-MX3', price: '$99', qty: 150, status: 'Published' },
  { id: 15, productName: 'Dell UltraSharp 27"', productBrand: 'Dell', image: 'https://picsum.photos/seed/monitor/38', category: 'Electronics', stock: true, sku: 'DLL-US27', price: '$599', qty: 40, status: 'Published' },
])

const filteredProducts = computed(() => {
  let result = allProducts.value

  if (searchQuery.value)
    result = result.filter(p => p.productName.toLowerCase().includes(searchQuery.value.toLowerCase()))

  if (selectedStatus.value)
    result = result.filter(p => p.status === selectedStatus.value)

  if (selectedCategory.value)
    result = result.filter(p => p.category === selectedCategory.value)

  if (selectedStock.value !== undefined && selectedStock.value !== null)
    result = result.filter(p => p.stock === selectedStock.value)

  if (sortBy.value) {
    result = [...result].sort((a: any, b: any) => {
      const valA = a[sortBy.value]
      const valB = b[sortBy.value]
      const dir = orderBy.value === 'desc' ? -1 : 1
      return valA > valB ? dir : valA < valB ? -dir : 0
    })
  }

  return result
})

const totalProduct = computed(() => filteredProducts.value.length)

const products = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value
  return filteredProducts.value.slice(start, start + itemsPerPage.value)
})

const deleteProduct = (id: number) => {
  const index = allProducts.value.findIndex(p => p.id === id)
  if (index !== -1)
    allProducts.value.splice(index, 1)

  const rowIndex = selectedRows.value.findIndex((row: any) => row === id)
  if (rowIndex !== -1)
    selectedRows.value.splice(rowIndex, 1)
}
</script>

<template>
  <div>
    <!-- 👉 widgets -->
    <VCard class="mb-6">
      <VCardText class="px-3">
        <VRow>
          <template
            v-for="(data, id) in widgetData"
            :key="id"
          >
            <VCol
              cols="12"
              sm="6"
              md="3"
              class="px-6"
            >
              <div
                class="d-flex justify-space-between"
                :class="$vuetify.display.xs
                  ? id !== widgetData.length - 1 ? 'border-b pb-4' : ''
                  : $vuetify.display.sm
                    ? id < (widgetData.length / 2) ? 'border-b pb-4' : ''
                    : ''"
              >
                <div class="d-flex flex-column gap-y-1">
                  <div class="text-body-1 text-capitalize">
                    {{ data.title }}
                  </div>

                  <h4 class="text-h4">
                    {{ data.value }}
                  </h4>

                  <div class="d-flex align-center gap-x-2">
                    <div class="text-no-wrap">
                      {{ data.desc }}
                    </div>

                    <VChip
                      v-if="data.change"
                      label
                      :color="data.change > 0 ? 'success' : 'error'"
                      size="small"
                    >
                      {{ prefixWithPlus(data.change) }}%
                    </VChip>
                  </div>
                </div>

                <VAvatar
                  variant="tonal"
                  rounded
                  size="44"
                >
                  <VIcon
                    :icon="data.icon"
                    size="28"
                    class="text-high-emphasis"
                  />
                </VAvatar>
              </div>
            </VCol>
            <VDivider
              v-if="$vuetify.display.mdAndUp ? id !== widgetData.length - 1
                : $vuetify.display.smAndUp ? id % 2 === 0
                  : false"
              vertical
              inset
              length="92"
            />
          </template>
        </VRow>
      </VCardText>
    </VCard>

    <!-- 👉 products -->
    <VCard
      title="Filters"
      class="mb-6"
    >
      <VCardText>
        <VRow>
          <!-- 👉 Select Status -->
          <VCol
            cols="12"
            sm="4"
          >
            <AppSelect
              v-model="selectedStatus"
              placeholder="Status"
              :items="status"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>

          <!-- 👉 Select Category -->
          <VCol
            cols="12"
            sm="4"
          >
            <AppSelect
              v-model="selectedCategory"
              placeholder="Category"
              :items="categories"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>

          <!-- 👉 Select Stock Status -->
          <VCol
            cols="12"
            sm="4"
          >
            <AppSelect
              v-model="selectedStock"
              placeholder="Stock"
              :items="stockStatus"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <div class="d-flex flex-wrap gap-4 ma-6">
        <div class="d-flex align-center">
          <!-- 👉 Search  -->
          <AppTextField
            v-model="searchQuery"
            placeholder="Search Product"
            style="inline-size: 200px;"
            class="me-3"
          />
        </div>

        <VSpacer />
        <div class="d-flex gap-4 flex-wrap align-center">
          <AppSelect
            v-model="itemsPerPage"
            :items="[5, 10, 20, 25, 50]"
          />
          <!-- 👉 Export button -->
          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="tabler-upload"
          >
            Export
          </VBtn>

          <VBtn
            color="primary"
            prepend-icon="tabler-plus"
            @click="$router.push('/apps/ecommerce/product/add')"
          >
            Add Product
          </VBtn>
        </div>
      </div>

      <VDivider class="mt-4" />

      <!-- 👉 Datatable  -->
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:model-value="selectedRows"
        v-model:page="page"
        :headers="headers"
        show-select
        :items="products"
        :items-length="totalProduct"
        class="text-no-wrap"
        @update:options="updateOptions"
      >
        <!-- product  -->
        <template #item.product="{ item }">
          <div class="d-flex align-center gap-x-4">
            <VAvatar
              v-if="item.image"
              size="38"
              variant="tonal"
              rounded
              :image="item.image"
            />
            <div class="d-flex flex-column">
              <span class="text-body-1 font-weight-medium text-high-emphasis">{{ item.productName }}</span>
              <span class="text-body-2">{{ item.productBrand }}</span>
            </div>
          </div>
        </template>

        <!-- category -->
        <template #item.category="{ item }">
          <VAvatar
            size="30"
            variant="tonal"
            :color="resolveCategory(item.category)?.color"
            class="me-4"
          >
            <VIcon
              :icon="resolveCategory(item.category)?.icon"
              size="18"
            />
          </VAvatar>
          <span class="text-body-1 text-high-emphasis">{{ item.category }}</span>
        </template>

        <!-- stock -->
        <template #item.stock="{ item }">
          <VSwitch :model-value="item.stock" />
        </template>

        <!-- status -->
        <template #item.status="{ item }">
          <VChip
            v-bind="resolveStatus(item.status)"
            density="default"
            label
            size="small"
          />
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <IconBtn>
            <VIcon icon="tabler-edit" />
          </IconBtn>

          <IconBtn>
            <VIcon icon="tabler-dots-vertical" />
            <VMenu activator="parent">
              <VList>
                <VListItem
                  value="download"
                  prepend-icon="tabler-download"
                >
                  Download
                </VListItem>

                <VListItem
                  value="delete"
                  prepend-icon="tabler-trash"
                  @click="deleteProduct(item.id)"
                >
                  Delete
                </VListItem>

                <VListItem
                  value="duplicate"
                  prepend-icon="tabler-copy"
                >
                  Duplicate
                </VListItem>
              </VList>
            </VMenu>
          </IconBtn>
        </template>

        <!-- pagination -->
        <template #bottom>
          <TablePagination
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalProduct"
          />
        </template>
      </VDataTableServer>
    </VCard>
  </div>
</template>
