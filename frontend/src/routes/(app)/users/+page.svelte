<!-- frontend/src/routes/users/+page.svelte -->
<!-- ✅ User Management Main Page -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authState } from '$lib/stores/auth';
  import { 
    userManagementState,
    userFormState,
    userStats,
    canManageUsers,
    loadUsers,
    loadUserStats,
    clearErrors
  } from '$lib/stores/userManagement';
  import UserList from '$lib/components/users/UserList.svelte';
  import UserForm from '$lib/components/users/UserForm.svelte';

  // Check authentication and permissions on mount
  onMount(async () => {
    console.log('User management page mounted');
    
    // Check if user is authenticated
    if (!$authState.isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      goto('/login');
      return;
    }

    // Check if user has permission to manage users
    if (!$canManageUsers) {
      console.log('User does not have permission to manage users');
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      goto('/dashboard');
      return;
    }

    // Load initial data
    console.log('Loading user management data...');
    await Promise.all([
      loadUsers(),
      loadUserStats()
    ]);
  });

  // Reactive statements
  $: isAuthenticated = $authState.isAuthenticated;
  $: canManage = $canManageUsers;
  $: stats = $userStats;
  $: currentUser = $authState.user;

  // Clear any existing errors when component mounts
  clearErrors();
</script>

<svelte:head>
  <title>การจัดการผู้ใช้งาน - ระบบเฝ้าระวังโรคติดต่อโดยแมลง</title>
  <meta name="description" content="จัดการผู้ใช้งานในระบบเฝ้าระวังโรคติดต่อโดยแมลง" />
</svelte:head>

<!-- Page Content -->
<div class="min-h-screen bg-gray-50">
  
  <!-- Header -->
  <div class="bg-white shadow">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="py-6">
        <div class="md:flex md:items-center md:justify-between">
          
          <!-- Title -->
          <div class="flex-1 min-w-0">
            <h1 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              การจัดการผู้ใช้งาน
            </h1>
            <div class="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div class="mt-2 flex items-center text-sm text-gray-500">
                <span class="mr-2">👤</span>
                จัดการบัญชีผู้ใช้งานในระบบ
              </div>
              
              {#if currentUser}
                <div class="mt-2 flex items-center text-sm text-gray-500">
                  <span class="mr-2">🔒</span>
                  เข้าสู่ระบบในฐานะ: <strong class="ml-1">{currentUser.name}</strong> ({currentUser.roleName})
                </div>
              {/if}
            </div>
          </div>

          <!-- Breadcrumb -->
          <div class="mt-4 md:mt-0">
            <nav class="flex" aria-label="Breadcrumb">
              <ol class="flex items-center space-x-2">
                <li>
                  <a href="/dashboard" class="text-gray-400 hover:text-gray-500">
                    หน้าหลัก
                  </a>
                </li>
                <li>
                  <span class="text-gray-400">/</span>
                </li>
                <li>
                  <span class="text-gray-600 font-medium">การจัดการผู้ใช้งาน</span>
                </li>
              </ol>
            </nav>
          </div>

        </div>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <!-- Permission Check -->
    {#if !isAuthenticated}
      <!-- Loading authentication state -->
      <div class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <p class="mt-2 text-sm text-gray-500">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
      </div>
      
    {:else if !canManage}
      <!-- No permission -->
      <div class="text-center py-12">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <span class="text-red-600 text-xl">🚫</span>
        </div>
        <h3 class="mt-2 text-sm font-medium text-gray-900">ไม่มีสิทธิ์เข้าถึง</h3>
        <p class="mt-1 text-sm text-gray-500">คุณไม่มีสิทธิ์เข้าถึงหน้าการจัดการผู้ใช้งาน</p>
        <div class="mt-6">
          <a
            href="/dashboard"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            กลับสู่หน้าหลัก
          </a>
        </div>
      </div>

    {:else}
      <!-- Statistics Cards (if stats available) -->
      {#if stats}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <!-- Total Users -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span class="text-white text-sm font-medium">👥</span>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">ผู้ใช้งานทั้งหมด</dt>
                    <dd class="text-lg font-medium text-gray-900">{stats.totalUsers.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- Active Users -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span class="text-white text-sm font-medium">✅</span>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">ใช้งานอยู่</dt>
                    <dd class="text-lg font-medium text-gray-900">{stats.activeUsers.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- Inactive Users -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <span class="text-white text-sm font-medium">❌</span>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">ปิดใช้งาน</dt>
                    <dd class="text-lg font-medium text-gray-900">{stats.inactiveUsers.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- New This Month -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span class="text-white text-sm font-medium">📅</span>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">ใหม่เดือนนี้</dt>
                    <dd class="text-lg font-medium text-gray-900">{stats.newUsersThisMonth.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Role Distribution (if available) -->
        {#if stats.byRole && stats.byRole.length > 0}
          <div class="bg-white shadow rounded-lg mb-8">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">การกระจายตามบทบาท</h3>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                {#each stats.byRole as roleData}
                  <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p class="text-sm font-medium text-gray-900">{roleData.roleName}</p>
                      <p class="text-xs text-gray-500">
                        {(() => {
                          switch(roleData.roleName) {
                            case 'SUPERUSER': return 'ผู้ดูแลระบบสูงสุด';
                            case 'ADMIN': return 'ผู้จัดการระดับภูมิภาค';
                            case 'USER': return 'เจ้าหน้าที่โรงพยาบาล';
                            default: return roleData.roleName;
                          }
                        })()}
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="text-lg font-semibold text-gray-900">{roleData.count}</p>
                      <p class="text-xs text-gray-500">
                        {((roleData.count / stats.totalUsers) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      {/if}

      <!-- User List Component -->
      <UserList />

      <!-- User Form Modal -->
      <UserForm />

      <!-- Additional Info Section -->
      <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <span class="text-blue-600 text-xl">💡</span>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-blue-800">คำแนะนำการใช้งาน</h3>
            <div class="mt-2 text-sm text-blue-700">
              <ul class="list-disc list-inside space-y-1">
                <li><strong>SUPERUSER:</strong> มีสิทธิ์เต็มรูปแบบในการจัดการทุกอย่าง รวมถึงการสร้าง SUPERUSER อื่นๆ</li>
                <li><strong>ADMIN:</strong> สามารถจัดการ USER และ ADMIN ได้ แต่ไม่สามารถจัดการ SUPERUSER</li>
                <li><strong>USER:</strong> เจ้าหน้าที่โรงพยาบาล จำเป็นต้องระบุโรงพยาบาลที่สังกัด</li>
                <li>รหัสผ่านต้องมีความแข็งแรง: ตัวพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ</li>
                <li>ผู้ใช้งานสามารถแก้ไขข้อมูลส่วนตัวของตนเองได้ที่หน้าโปรไฟล์</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    {/if}
  </div>
</div>

<style>
  /* Custom loading animation */
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }

  /* Responsive table on mobile */
  @media (max-width: 768px) {
    .table-mobile {
      display: block;
      white-space: nowrap;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
  }

  /* Custom focus styles */
  .focus-ring:focus {
    outline: 2px solid transparent;
    outline-offset: 2px;
    box-shadow: 0 0 0 2px #10b981;
  }

  /* Custom hover effects */
  .hover-lift:hover {
    transform: translateY(-1px);
    transition: transform 0.2s ease-in-out;
  }
</style>