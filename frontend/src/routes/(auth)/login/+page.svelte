<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { login, loginState, authState, clearAuthError } from '$lib/stores/auth';
  import type { LoginCredentials } from '$lib/api/types';
  import { isDevelopment } from '$lib/config/env';

  // Form data
  let formData: LoginCredentials = {
    username: '',
    password: '',
  };
  
  let formErrors: Record<string, string> = {};
  let showPassword = false;

  // Reactive subscriptions
  $: isLoading = $loginState.isLoading;
  $: loginError = $loginState.error;
  $: isAuthenticated = $authState.isAuthenticated;

  // Demo credentials for development
  const demoCredentials = {
    superuser: { username: 'superuser', password: 'password123' },
    admin: { username: 'admin', password: 'password123' },
    user: { username: 'user', password: 'password123' },
  };

  // เพิ่ม console.log สำหรับ Debugging state
  $: console.log(
    'DEBUG (login/+page.svelte): Current state - isLoading:', isLoading, 
    'loginError:', loginError, 
    'isAuthenticated:', isAuthenticated, 
    'authState.user:', $authState.user?.username
  );

  onMount(() => {
    console.log('DEBUG (login/+page.svelte): onMount called.');
    clearAuthError();
    
    // Redirect if already authenticated
    if (isAuthenticated) {
      const redirectTo = $page.url.searchParams.get('redirect') || '/dashboard';
      console.log('DEBUG (login/+page.svelte): User already authenticated onMount, redirecting to:', redirectTo);
      goto(redirectTo);
    }
  });

  // Watch for successful authentication  
  $: if (isAuthenticated) {
    const redirectTo = $page.url.searchParams.get('redirect') || '/dashboard';
    console.log('DEBUG (login/+page.svelte): isAuthenticated changed to TRUE. Attempting redirect to:', redirectTo);
    // เพิ่ม setTimeout เพื่อให้แน่ใจว่า Svelte cycle สมบูรณ์และ goto มีเวลาทำงาน
    // หรือเพื่อดูว่ามีอะไรมาขัดจังหวะหรือไม่
    setTimeout(() => {
        goto(redirectTo);
        console.log('DEBUG (login/+page.svelte): goto() called with', redirectTo);
    }, 50); // ลองหน่วงเวลาเล็กน้อย
  }

  // Form validation
  function validateForm(): boolean {
    // ... (โค้ดเดิม ไม่ต้องแก้ไข)
    const errors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      errors.username = 'กรุณาใส่ชื่อผู้ใช้งาน';
    } else if (formData.username.length < 3) {
      errors.username = 'ชื่อผู้ใช้งานต้องมีอย่างน้อย 3 ตัวอักษร';
    }
    
    if (!formData.password) {
      errors.password = 'กรุณาใส่รหัสผ่าน';
    } else if (formData.password.length < 6) {
      errors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }
    
    formErrors = errors;
    console.log('DEBUG (login/+page.svelte): Form validation errors:', formErrors);
    return Object.keys(errors).length === 0;
  }

  // Handle form submission
  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    if (!validateForm()) {
        console.log('DEBUG (login/+page.svelte): Form validation failed. Not submitting.');
        return;
    }
    
    clearAuthError();
    console.log('DEBUG (login/+page.svelte): Submitting login form with:', formData.username);
    await login(formData);
    // การ redirect จะถูกจัดการโดย reactive statement ($: if (isAuthenticated))
    // ดังนั้นไม่จำเป็นต้องใส่ goto() ตรงนี้อีก
    console.log('DEBUG (login/+page.svelte): login() function completed. Checking isAuthenticated for redirect...');
  }

  // Fill demo credentials
  function fillDemo(role: keyof typeof demoCredentials) {
    formData = { ...demoCredentials[role] };
    formErrors = {};
    console.log('DEBUG (login/+page.svelte): Filled demo credentials for role:', role);
  }

  // Toggle password visibility
  function togglePassword() {
    showPassword = !showPassword;
    console.log('DEBUG (login/+page.svelte): Password visibility toggled to:', showPassword);
  }

  // Clear field error on input
  function clearFieldError(field: string) {
    if (formErrors[field]) {
      delete formErrors[field];
      formErrors = { ...formErrors };
      console.log('DEBUG (login/+page.svelte): Cleared error for field:', field);
    }
  }
</script>

<svelte:head>
  <title>เข้าสู่ระบบ - ระบบเฝ้าระวังโรคติดต่อโดยแมลง</title>
</svelte:head>

<div class="login-container">
  <div class="login-card">
    <div class="login-header">
      <div class="logo">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1>เข้าสู่ระบบ</h1>
      <p>ระบบเฝ้าระวังโรคติดต่อโดยแมลง</p>
    </div>

    <form on:submit={handleSubmit} class="login-form">
      <div class="form-group">
        <label for="username">ชื่อผู้ใช้งาน <span class="required">*</span></label>
        <input
          id="username"
          type="text"
          bind:value={formData.username}
          on:input={() => clearFieldError('username')}
          placeholder="กรุณาใส่ชื่อผู้ใช้งาน"
          disabled={isLoading}
          class:error={formErrors.username}
        />
        {#if formErrors.username}
          <span class="error-message">{formErrors.username}</span>
        {/if}
      </div>

      <div class="form-group">
        <label for="password">รหัสผ่าน <span class="required">*</span></label>
        <div class="password-input">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            bind:value={formData.password}
            on:input={() => clearFieldError('password')}
            placeholder="กรุณาใส่รหัสผ่าน"
            disabled={isLoading}
            class:error={formErrors.password}
          />
          <button
            type="button"
            class="password-toggle"
            on:click={togglePassword}
            disabled={isLoading}
            aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
          >
            {#if showPassword}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M14.12 14.12l1.415 1.415"/>
              </svg>
            {:else}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            {/if}
          </button>
        </div>
        {#if formErrors.password}
          <span class="error-message">{formErrors.password}</span>
        {/if}
      </div>

      {#if loginError}
        <div class="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {loginError}
        </div>
      {/if}

      <button type="submit" class="btn btn-primary" disabled={isLoading}>
        {#if isLoading}
          <div class="spinner"></div>
          กำลังเข้าสู่ระบบ...
        {:else}
          เข้าสู่ระบบ
        {/if}
      </button>
    </form>

    {#if isDevelopment}
      <div class="demo-section">
        <h3>ข้อมูลสำหรับทดสอบ</h3>
        <div class="demo-buttons">
          <button
            type="button"
            class="demo-btn"
            on:click={() => fillDemo('superuser')}
          >
            <span class="badge superuser">SUPERUSER</span>
            superuser / password123
          </button>
          <button
            type="button"
            class="demo-btn"
            on:click={() => fillDemo('admin')}
          >
            <span class="badge admin">ADMIN</span>
            admin / password123
          </button>
          <button
            type="button"
            class="demo-btn"
            on:click={() => fillDemo('user')}
          >
            <span class="badge user">USER</span>
            user / password123
          </button>
        </div>
      </div>
    {/if}

    <div class="login-footer">
      <p>กรมควบคุมโรค กระทรวงสาธารณสุข</p>
      <small>Disease Surveillance System v1.0.0</small>
    </div>
  </div>
</div>

<style>
  /* CSS Variables - Design System Colors */
  :root {
    --primary: #16a085;
    --background: #f8f9fa;
    --card-bg: #ffffff;
    --text-primary: #2c3e50;
    --text-secondary: #7f8c8d;
    --success: #27ae60;
    --warning: #f39c12;
    --danger: #e74c3c;
    --info: #3498db;
    --gray-100: #f1f3f4;
    --gray-200: #e9ecef;
    --gray-300: #dee2e6;
  }

  /* Container */
  .login-container {
    min-height: 100vh;
    background-color: var(--background);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    font-family: 'Inter', 'Sarabun', sans-serif;
  }

  /* Card */
  .login-card {
    background: var(--card-bg);
    border-radius: 12px;
    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.1);
    padding: 32px;
    width: 100%;
    max-width: 400px;
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  /* Header */
  .login-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    background: var(--primary);
    border-radius: 50%;
    color: white;
    margin-bottom: 16px;
  }

  .login-header h1 {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 8px 0;
  }

  .login-header p {
    font-size: 16px;
    color: var(--text-secondary);
    margin: 0;
  }

  /* Form */
  .login-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .required {
    color: var(--danger);
  }

  /* Input */
  input {
    width: 100%;
    padding: 12px;
    font-size: 16px;
    border: 1px solid var(--gray-300);
    border-radius: 8px;
    background: var(--card-bg);
    min-height: 44px;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(22, 160, 133, 0.1);
  }

  input:disabled {
    background: var(--gray-100);
    cursor: not-allowed;
    opacity: 0.6;
  }

  input.error {
    border-color: var(--danger);
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
  }

  /* Password Input */
  .password-input {
    position: relative;
  }

 

  .password-toggle:hover {
    color: var(--text-primary);
  }

  /* Error Message */
  .error-message {
    font-size: 14px;
    color: var(--danger);
  }

  /* Alert */
  .alert {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    border-radius: 8px;
    font-size: 14px;
  }

  .alert-error {
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.2);
    color: var(--danger);
  }

  /* Button */
  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    font-size: 16px;
    font-weight: 500;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    min-height: 44px;
    transition: all 0.15s ease;
  }

  .btn-primary {
    background: var(--primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #128a71;
    box-shadow: 0 4px 15px rgba(22, 160, 133, 0.3);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Spinner */
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Demo Section */
  .demo-section {
    margin-top: 24px;
    padding: 16px;
    background: rgba(52, 152, 219, 0.05);
    border: 1px solid rgba(52, 152, 219, 0.2);
    border-radius: 8px;
  }

  .demo-section h3 {
    font-size: 14px;
    color: var(--info);
    margin: 0 0 12px 0;
  }

  .demo-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .demo-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: white;
    border: 1px solid var(--gray-300);
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    color: var(--text-primary);
    transition: background 0.15s ease;
  }

  .demo-btn:hover {
    background: var(--gray-100);
  }

  /* Badge */
  .badge {
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 12px;
    text-transform: uppercase;
  }

  .badge.superuser {
    background: rgba(231, 76, 60, 0.1);
    color: var(--danger);
  }

  .badge.admin {
    background: rgba(243, 156, 18, 0.1);
    color: var(--warning);
  }

  .badge.user {
    background: rgba(52, 152, 219, 0.1);
    color: var(--info);
  }

  /* Footer */
  .login-footer {
    text-align: center;
    margin-top: 32px;
    color: var(--text-secondary);
  }

  .login-footer p {
    margin: 0 0 4px 0;
    font-size: 14px;
  }

  .login-footer small {
    font-size: 12px;
    color: var(--text-secondary);
  }

  /* Mobile Responsive */
  @media (max-width: 640px) {
    .login-card {
      padding: 24px;
      margin: 8px;
    }
    
    .login-header h1 {
      font-size: 20px;
    }
    
    .login-header p {
      font-size: 14px;
    }
  }
</style>