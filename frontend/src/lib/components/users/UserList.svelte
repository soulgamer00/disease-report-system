<!-- frontend/src/lib/components/users/UserList.svelte -->
<!-- ✅ User Management List Component -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    userManagementState, 
    userFormState,
    canManageUsers,
    canCreateUsers,
    canDeleteUsers,
    currentUserRole,
    loadUsers,
    deleteUser,
    openCreateForm,
    openEditForm,
    openViewForm,
    clearErrors
  } from '$lib/stores/userManagement';
  import { authState } from '$lib/stores/auth';
  import type { User } from '$lib/api/types';

  // Props
  export let showCreateButton = true;
  export let showActions = true;
  export let compact = false;

  // Local state
  let searchTerm = '';
  let selectedRole = '';
  let selectedHospital = '';
  let showActiveOnly = true;
  let currentPage = 1;
  let showConfirmDelete = false;
  let userToDelete: User | null = null;

  // Reactive statements
  $: canManage = $canManageUsers;
  $: canCreate = $canCreateUsers;
  $: canDelete = $canDeleteUsers;
  $: userRole = $currentUserRole;
  $: users = $userManagementState.users;
  $: isLoading = $userManagementState.isLoading;
  $: error = $userManagementState.error;
  $: pagination = $userManagementState.pagination;

  // Load users on mount
  onMount(() => {
    if (canManage) {
      loadUsersWithFilters();
    }
  });

  // Functions
  async function loadUsersWithFilters() {
    const filters: any = {
      page: currentPage,
      limit: 20,
      search: searchTerm || undefined,
      roleId: selectedRole ? parseInt(selectedRole) : undefined,
      hospitalCode: selectedHospital || undefined,
      isActive: showActiveOnly,
    };

    await loadUsers(filters);
  }

  function handleSearch() {
    currentPage = 1;
    loadUsersWithFilters();
  }

  function handlePageChange(page: number) {
    currentPage = page;
    loadUsersWithFilters();
  }

  function handleCreateUser() {
    clearErrors();
    openCreateForm();
  }

  function handleEditUser(user: User) {
    clearErrors();
    openEditForm(user);
  }

  function handleViewUser(user: User) {
    clearErrors();
    openViewForm(user);
  }

  function confirmDelete(user: User) {
    userToDelete = user;
    showConfirmDelete = true;
  }

  async function handleDeleteUser() {
    if (userToDelete) {
      const result = await deleteUser(userToDelete.id);
      
      if (result.success) {
        alert('ลบผู้ใช้งานเรียบร้อยแล้ว');
      } else {
        alert(`เกิดข้อผิดพลาด: ${result.error}`);
      }
    }
    
    showConfirmDelete = false;
    userToDelete = null;
  }

  function cancelDelete() {
    showConfirmDelete = false;
    userToDelete = null;
  }

  function getRoleBadgeClass(roleName: string): string {
    switch (roleName) {
      case 'SUPERUSER': return 'bg-red-100 text-red-800';
      case 'ADMIN': return 'bg-yellow-100 text-yellow-800';
      case 'USER': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusBadgeClass(isActive: boolean): string {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('th-TH');
  }
</script>

<!-- Permission Guard -->
{#if !canManage}
  <div class="text-center py-8">
    <p class="text-gray-500">คุณไม่มีสิทธิ์เข้าถึงการจัดการผู้ใช้งาน</p>
  </div>
{:else}

<!-- Header -->
<div class="bg-white shadow rounded-lg">
  <div class="px-6 py-4 border-b border-gray-200">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">การจัดการผู้ใช้งาน</h2>
        <p class="text-sm text-gray-600">จัดการบัญชีผู้ใช้งานในระบบ</p>
      </div>
      
      {#if showCreateButton && canCreate}
        <button
          on:click={handleCreateUser}
          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          + เพิ่มผู้ใช้งานใหม่
        </button>
      {/if}
    </div>
  </div>

  <!-- Search & Filters -->
  <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- Search -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">ค้นหา</label>
        <input
          type="text"
          bind:value={searchTerm}
          on:input={handleSearch}
          placeholder="ชื่อ, ชื่อผู้ใช้, อีเมล..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
        />
      </div>

      <!-- Role Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">บทบาท</label>
        <select
          bind:value={selectedRole}
          on:change={handleSearch}
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
        >
          <option value="">ทุกบทบาท</option>
          <option value="1">SUPERUSER</option>
          <option value="2">ADMIN</option>
          <option value="3">USER</option>
        </select>
      </div>

      <!-- Hospital Filter (for SUPERUSER/ADMIN) -->
      {#if userRole.isSuperuser || userRole.isAdmin}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">โรงพยาบาล</label>
          <select
            bind:value={selectedHospital}
            on:change={handleSearch}
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
          >
            <option value="">ทุกโรงพยาบาล</option>
            <option value="VCH01">โรงพยาบาลวิเชียรบุรี</option>
            <option value="PSL01">โรงพยาบาลพิษณุโลก</option>
            <option value="TRG01">รพ.สต.ท่าโรง</option>
          </select>
        </div>
      {/if}

      <!-- Status Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
        <label class="flex items-center mt-2">
          <input
            type="checkbox"
            bind:checked={showActiveOnly}
            on:change={handleSearch}
            class="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <span class="ml-2 text-sm text-gray-700">แสดงเฉพาะที่ใช้งานอยู่</span>
        </label>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  {#if isLoading}
    <div class="px-6 py-8 text-center">
      <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
      <p class="mt-2 text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
    </div>
  
  <!-- Error State -->
  {:else if error}
    <div class="px-6 py-8 text-center">
      <p class="text-red-600 text-sm">{error}</p>
      <button
        on:click={loadUsersWithFilters}
        class="mt-2 text-green-600 hover:text-green-700 text-sm font-medium"
      >
        ลองใหม่อีกครั้ง
      </button>
    </div>

  <!-- Users Table -->
  {:else if users.length === 0}
    <div class="px-6 py-8 text-center">
      <p class="text-gray-500">ไม่พบข้อมูลผู้ใช้งาน</p>
      {#if searchTerm || selectedRole || selectedHospital}
        <button
          on:click={() => {
            searchTerm = '';
            selectedRole = '';
            selectedHospital = '';
            handleSearch();
          }}
          class="mt-2 text-green-600 hover:text-green-700 text-sm font-medium"
        >
          ล้างตัวกรอง
        </button>
      {/if}
    </div>

  {:else}
    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ผู้ใช้งาน
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              บทบาท
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              โรงพยาบาล
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              สถานะ
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              วันที่สร้าง
            </th>
            {#if showActions}
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                การจัดการ
              </th>
            {/if}
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each users as user (user.id)}
            <tr class="hover:bg-gray-50">
              <!-- User Info -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span class="text-green-600 font-medium text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{user.name}</div>
                    <div class="text-sm text-gray-500">@{user.username}</div>
                    {#if user.email}
                      <div class="text-xs text-gray-400">{user.email}</div>
                    {/if}
                  </div>
                </div>
              </td>

              <!-- Role -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getRoleBadgeClass(user.roleName)}">
                  {user.roleName}
                </span>
              </td>

              <!-- Hospital -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {#if user.hospitalName}
                  <div>{user.hospitalName}</div>
                  <div class="text-xs text-gray-500">{user.hospitalCode}</div>
                {:else}
                  <span class="text-gray-400">-</span>
                {/if}
              </td>

              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusBadgeClass(user.isActive)}">
                  {user.isActive ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}
                </span>
              </td>

              <!-- Created Date -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(user.createdAt)}
              </td>

              <!-- Actions -->
              {#if showActions}
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <!-- View -->
                    <button
                      on:click={() => handleViewUser(user)}
                      class="text-green-600 hover:text-green-900 p-1"
                      title="ดูรายละเอียด"
                    >
                      👁️
                    </button>

                    <!-- Edit -->
                    {#if canManage}
                      <button
                        on:click={() => handleEditUser(user)}
                        class="text-blue-600 hover:text-blue-900 p-1"
                        title="แก้ไข"
                      >
                        ✏️
                      </button>
                    {/if}

                    <!-- Delete -->
                    {#if canDelete && user.id !== $authState.user?.id}
                      <button
                        on:click={() => confirmDelete(user)}
                        class="text-red-600 hover:text-red-900 p-1"
                        title="ลบ"
                      >
                        🗑️
                      </button>
                    {/if}
                  </div>
                </td>
              {/if}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if pagination && pagination.pages > 1}
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500">
            แสดง {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 
            จาก {pagination.total} รายการ
          </div>
          
          <div class="flex space-x-2">
            <!-- Previous -->
            <button
              on:click={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              class="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ← ก่อนหน้า
            </button>

            <!-- Page Numbers -->
            {#each Array(Math.min(5, pagination.pages)) as _, i}
              {@const pageNum = Math.max(1, pagination.page - 2) + i}
              {#if pageNum <= pagination.pages}
                <button
                  on:click={() => handlePageChange(pageNum)}
                  class="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 {pagination.page === pageNum ? 'bg-green-600 text-white border-green-600' : ''}"
                >
                  {pageNum}
                </button>
              {/if}
            {/each}

            <!-- Next -->
            <button
              on:click={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              class="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ถัดไป →
            </button>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showConfirmDelete && userToDelete}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3 text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <span class="text-red-600 text-xl">⚠️</span>
        </div>
        
        <h3 class="text-lg font-medium text-gray-900 mb-2">ยืนยันการลบผู้ใช้งาน</h3>
        
        <p class="text-sm text-gray-500 mb-4">
          คุณต้องการลบผู้ใช้งาน <strong>{userToDelete.name}</strong> หรือไม่?<br/>
          การดำเนินการนี้ไม่สามารถยกเลิกได้
        </p>
        
        <div class="flex justify-center space-x-4">
          <button
            on:click={cancelDelete}
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            ยกเลิก
          </button>
          
          <button
            on:click={handleDeleteUser}
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            ลบผู้ใช้งาน
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

{/if}