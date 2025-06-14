<!-- frontend/src/lib/components/users/UserForm.svelte -->
<!-- ✅ User Create/Edit Form Component -->

<script lang="ts">
  import { 
    userFormState,
    currentUserRole,
    createUser,
    updateUser,
    closeForm,
    clearErrors
  } from '$lib/stores/userManagement';
  import type { CreateUserData, UpdateUserData, User } from '$lib/api/types';

  // Reactive data
  $: isOpen = $userFormState.isOpen;
  $: isLoading = $userFormState.isLoading;
  $: error = $userFormState.error;
  $: mode = $userFormState.mode;
  $: editingUser = $userFormState.editingUser;
  $: userRole = $currentUserRole;

  // Form data
  let formData = {
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
    phoneNumber: '',
    roleId: 3, // Default to USER
    hospitalCode: '',
    department: '',
    position: '',
  };

  // Form validation
  let validationErrors: Record<string, string> = {};
  let showPassword = false;
  let showConfirmPassword = false;

  // Available options
  const roles = [
    { id: 1, name: 'SUPERUSER', label: 'ผู้ดูแลระบบสูงสุด', disabled: false },
    { id: 2, name: 'ADMIN', label: 'ผู้จัดการระดับภูมิภาค', disabled: false },
    { id: 3, name: 'USER', label: 'เจ้าหน้าที่โรงพยาบาล', disabled: false },
  ];

  const hospitals = [
    { code: 'VCH01', name: 'โรงพยาบาลวิเชียรบุรี' },
    { code: 'PSL01', name: 'โรงพยาบาลพิษณุโลก' },
    { code: 'TRG01', name: 'รพ.สต.ท่าโรง' },
  ];

  // Reactive statements
  $: {
    // Filter roles based on current user permissions and editing target
    if (!userRole.isSuperuser) {
      roles[0].disabled = true; // ADMIN cannot create/assign SUPERUSER
    }

    // ✅ SECURITY FIX: ป้องกัน ADMIN แก้ไข SUPERUSER
    if (mode === 'edit' && editingUser && editingUser.roleName === 'SUPERUSER' && !userRole.isSuperuser) {
      // If ADMIN tries to edit SUPERUSER, disable form
      console.warn('ADMIN cannot edit SUPERUSER account');
    }
  }

  $: {
    // Populate form when editing
    if (mode === 'edit' && editingUser) {
      formData = {
        username: editingUser.username,
        password: '',
        confirmPassword: '',
        name: editingUser.name,
        email: editingUser.email || '',
        phoneNumber: editingUser.phoneNumber || '',
        roleId: editingUser.roleId,
        hospitalCode: editingUser.hospitalCode || '',
        department: editingUser.department || '',
        position: editingUser.position || '',
      };
    } else if (mode === 'create') {
      formData = {
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        email: '',
        phoneNumber: '',
        roleId: 3,
        hospitalCode: '',
        department: '',
        position: '',
      };
    }
  }

  $: requiresHospital = formData.roleId === 3; // USER role requires hospital

  // ✅ SECURITY: Show warning if ADMIN tries to edit SUPERUSER
  $: showPermissionWarning = mode === 'edit' && editingUser && editingUser.roleName === 'SUPERUSER' && !userRole.isSuperuser;

  // Functions
  function validateForm(): boolean {
    validationErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      validationErrors.username = 'ชื่อผู้ใช้งานจำเป็นต้องระบุ';
    } else if (formData.username.length < 3) {
      validationErrors.username = 'ชื่อผู้ใช้งานต้องมีอย่างน้อย 3 ตัวอักษร';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(formData.username)) {
      validationErrors.username = 'ชื่อผู้ใช้งานสามารถใช้ได้เฉพาะตัวอักษร ตัวเลข _ . -';
    }

    // Password validation (for create mode)
    if (mode === 'create') {
      if (!formData.password) {
        validationErrors.password = 'รหัสผ่านจำเป็นต้องระบุ';
      } else if (formData.password.length < 8) {
        validationErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
        validationErrors.password = 'รหัสผ่านต้องมีตัวพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ';
      }

      if (formData.password !== formData.confirmPassword) {
        validationErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
      }
    }

    // Name validation
    if (!formData.name.trim()) {
      validationErrors.name = 'ชื่อ-นามสกุลจำเป็นต้องระบุ';
    } else if (formData.name.length < 2) {
      validationErrors.name = 'ชื่อ-นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร';
    }

    // Email validation (optional)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      validationErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    // Phone validation (optional)
    if (formData.phoneNumber && !/^(\+66|0)[0-9]{8,9}$/.test(formData.phoneNumber)) {
      validationErrors.phoneNumber = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';
    }

    // Hospital validation for USER role
    if (requiresHospital && !formData.hospitalCode) {
      validationErrors.hospitalCode = 'ผู้ใช้งานระดับ USER ต้องระบุโรงพยาบาล';
    }

    return Object.keys(validationErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    try {
      let result;

      if (mode === 'create') {
        const createData: CreateUserData = {
          username: formData.username,
          password: formData.password,
          name: formData.name,
          roleId: formData.roleId,
          email: formData.email || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          hospitalCode: formData.hospitalCode || undefined,
          department: formData.department || undefined,
          position: formData.position || undefined,
        };

        result = await createUser(createData);
      } else if (mode === 'edit' && editingUser) {
        const updateData: UpdateUserData = {
          name: formData.name,
          roleId: formData.roleId,
          email: formData.email || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          hospitalCode: formData.hospitalCode || undefined,
          department: formData.department || undefined,
          position: formData.position || undefined,
        };

        result = await updateUser(editingUser.id, updateData);
      }

      if (result?.success) {
        alert(mode === 'create' ? 'สร้างผู้ใช้งานเรียบร้อยแล้ว' : 'อัปเดตข้อมูลเรียบร้อยแล้ว');
        closeForm();
      }
    } catch (err) {
      console.error('Form submission error:', err);
    }
  }

  function handleCancel() {
    closeForm();
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeForm();
    }
  }

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }

  function toggleConfirmPasswordVisibility() {
    showConfirmPassword = !showConfirmPassword;
  }

  function clearError() {
    clearErrors();
  }
</script>

<!-- Modal -->
{#if isOpen}
  <div 
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    on:click={handleOverlayClick}
  >
    <div class="relative top-8 mx-auto p-0 border w-full max-w-2xl shadow-lg rounded-lg bg-white my-8">
      
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900">
            {#if mode === 'create'}
              เพิ่มผู้ใช้งานใหม่
            {:else if mode === 'edit'}
              แก้ไขข้อมูลผู้ใช้งาน
            {:else}
              ดูข้อมูลผู้ใช้งาน
            {/if}
          </h3>
          
          <button
            on:click={closeForm}
            class="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Body -->
      <form on:submit|preventDefault={handleSubmit} class="px-6 py-4">
        
        <!-- Permission Warning -->
        {#if showPermissionWarning}
          <div class="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
            <div class="flex items-center">
              <span class="mr-2">⚠️</span>
              <span>คุณไม่มีสิทธิ์แก้ไขผู้ใช้งานระดับ SUPERUSER</span>
            </div>
          </div>
        {/if}
        
        <!-- Error Display -->
        {#if error}
          <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <div class="flex justify-between items-center">
              <span>{error}</span>
              <button type="button" on:click={clearError} class="text-red-500 hover:text-red-700">✕</button>
            </div>
          </div>
        {/if}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Username -->
          <div class="md:col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              ชื่อผู้ใช้งาน <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              bind:value={formData.username}
              disabled={mode === 'edit' || mode === 'view' || showPermissionWarning}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              class:border-red-500={validationErrors.username}
              placeholder="ชื่อผู้ใช้งาน (a-z, 0-9, _, ., -)"
            />
            {#if validationErrors.username}
              <p class="mt-1 text-sm text-red-600">{validationErrors.username}</p>
            {/if}
          </div>

          <!-- Name -->
          <div class="md:col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              ชื่อ-นามสกุล <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              bind:value={formData.name}
              disabled={mode === 'view'}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
              class:border-red-500={validationErrors.name}
              placeholder="ชื่อ-นามสกุล"
            />
            {#if validationErrors.name}
              <p class="mt-1 text-sm text-red-600">{validationErrors.name}</p>
            {/if}
          </div>

          <!-- Password (Create mode only) -->
          {#if mode === 'create'}
            <div class="md:col-span-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่าน <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  bind:value={formData.password}
                  class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  class:border-red-500={validationErrors.password}
                  placeholder="รหัสผ่าน (8+ ตัวอักษร)"
                />
                <button
                  type="button"
                  on:click={togglePasswordVisibility}
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {#if validationErrors.password}
                <p class="mt-1 text-sm text-red-600">{validationErrors.password}</p>
              {/if}
            </div>

            <!-- Confirm Password -->
            <div class="md:col-span-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                ยืนยันรหัสผ่าน <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  bind:value={formData.confirmPassword}
                  class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  class:border-red-500={validationErrors.confirmPassword}
                  placeholder="ยืนยันรหัสผ่าน"
                />
                <button
                  type="button"
                  on:click={toggleConfirmPasswordVisibility}
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {#if validationErrors.confirmPassword}
                <p class="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
              {/if}
            </div>
          {/if}

          <!-- Role -->
          <div class="md:col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              บทบาท <span class="text-red-500">*</span>
            </label>
            <select
              bind:value={formData.roleId}
              disabled={mode === 'view'}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
            >
              {#each roles as role}
                <option value={role.id} disabled={role.disabled}>
                  {role.label}
                </option>
              {/each}
            </select>
          </div>

          <!-- Hospital -->
          <div class="md:col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              โรงพยาบาล {requiresHospital ? '⭐' : ''}
            </label>
            <select
              bind:value={formData.hospitalCode}
              disabled={mode === 'view'}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
              class:border-red-500={validationErrors.hospitalCode}
            >
              <option value="">เลือกโรงพยาบาล</option>
              {#each hospitals as hospital}
                <option value={hospital.code}>{hospital.name}</option>
              {/each}
            </select>
            {#if validationErrors.hospitalCode}
              <p class="mt-1 text-sm text-red-600">{validationErrors.hospitalCode}</p>
            {/if}
            {#if requiresHospital}
              <p class="mt-1 text-xs text-gray-500">จำเป็นสำหรับผู้ใช้งานระดับ USER</p>
            {/if}
          </div>

          <!-- Email -->
          <div class="md:col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
            <input
              type="email"
              bind:value={formData.email}
              disabled={mode === 'view'}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
              class:border-red-500={validationErrors.email}
              placeholder="example@domain.com"
            />
            {#if validationErrors.email}
              <p class="mt-1 text-sm text-red-600">{validationErrors.email}</p>
            {/if}
          </div>

          <!-- Phone -->
          <div class="md:col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              bind:value={formData.phoneNumber}
              disabled={mode === 'view'}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
              class:border-red-500={validationErrors.phoneNumber}
              placeholder="081-234-5678"
            />
            {#if validationErrors.phoneNumber}
              <p class="mt-1 text-sm text-red-600">{validationErrors.phoneNumber}</p>
            {/if}
          </div>

          <!-- Department -->
          <div class="md:col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">แผนก</label>
            <input
              type="text"
              bind:value={formData.department}
              disabled={mode === 'view'}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
              placeholder="แผนกงาน"
            />
          </div>

          <!-- Position -->
          <div class="md:col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง</label>
            <input
              type="text"
              bind:value={formData.position}
              disabled={mode === 'view'}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
              placeholder="ตำแหน่งงาน"
            />
          </div>

        </div>
      </form>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            on:click={handleCancel}
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {mode === 'view' ? 'ปิด' : 'ยกเลิก'}
          </button>
          
          {#if mode !== 'view'}
            <button
              type="submit"
              on:click={handleSubmit}
              disabled={isLoading}
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isLoading}
                <span class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                กำลังบันทึก...
              {:else}
                {mode === 'create' ? 'สร้างผู้ใช้งาน' : 'บันทึกการเปลี่ยนแปลง'}
              {/if}
            </button>
          {/if}
        </div>
      </div>

    </div>
  </div>
{/if}