<!-- src/routes/(app)/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authState, userRole, logout } from '$lib/stores/auth';

  // ===== Reactive State =====
  $: user = $authState.user;
  $: role = $userRole;
  $: isAuthenticated = $authState.isAuthenticated;
  $: isLoading = $authState.isLoading;
  $: currentPath = $page.url.pathname;

  // ===== Navigation Items =====
  const navigationItems = [
    {
      title: 'หน้าหลัก',
      href: '/dashboard',
      icon: 'home',
      permissions: ['ALL']
    },
    {
      title: 'จัดการผู้ป่วย',
      href: '/patients',
      icon: 'users',
      permissions: ['ALL']
    },
    {
      title: 'จัดการโรงพยาบาล',
      href: '/hospitals',
      icon: 'building',
      permissions: ['ADMIN', 'SUPERUSER']
    },
    {
      title: 'จัดการผู้ใช้งาน',
      href: '/users',
      icon: 'user-cog',
      permissions: ['ADMIN', 'SUPERUSER']
    },
    {
      title: 'รายงานสถิติ',
      href: '/reports',
      icon: 'chart-bar',
      permissions: ['ALL']
    },
    {
      title: 'ข้อมูลหลัก',
      href: '/master-data',
      icon: 'database',
      permissions: ['ADMIN', 'SUPERUSER']
    }
  ];

  // ===== Mobile Navigation =====
  let isMobileMenuOpen = false;

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  function closeMobileMenu() {
    isMobileMenuOpen = false;
  }

  // ===== Navigation Helpers =====
  function canAccessItem(permissions: string[]): boolean {
    if (permissions.includes('ALL')) return true;
    if (!user) return false;
    return permissions.includes(user.roleName);
  }

  function isActiveRoute(href: string): boolean {
    if (href === '/dashboard') {
      return currentPath === '/dashboard';
    }
    return currentPath.startsWith(href);
  }

  function getIcon(iconName: string): string {
    const icons = {
      home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
      building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      'user-cog': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      'chart-bar': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      database: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4'
    };
    return icons[iconName as keyof typeof icons] || icons.home;
  }

  // ===== Lifecycle =====
  onMount(() => {
    // Redirect if not authenticated
    if (!isLoading && !isAuthenticated) {
      goto('/login');
    }
  });

  // ===== Event Handlers =====
  async function handleLogout() {
    await logout();
  }
</script>

<svelte:head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

{#if isLoading}
  <div class="loading-container">
    <div class="spinner"></div>
    <p>กำลังโหลด...</p>
  </div>
{:else if isAuthenticated && user}
  <div class="app-layout">
    <!-- Top Navigation Bar -->
    <header class="top-nav">
      <div class="nav-content">
        <div class="nav-brand">
          <button 
            class="mobile-menu-btn md:hidden"
            on:click={toggleMobileMenu}
            aria-label="เมนู"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          
          <div class="brand-text">
            <h1>ระบบเฝ้าระวังโรค</h1>
            <span>Disease Surveillance System</span>
          </div>
        </div>

        <div class="nav-user">
          <div class="user-info hidden md:block">
            <span class="user-name">{user.name}</span>
            <span class="user-role role-{role.name?.toLowerCase()}">{user.roleName}</span>
          </div>
          
          <button class="logout-btn" on:click={handleLogout} title="ออกจากระบบ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Desktop Sidebar -->
    <aside class="sidebar hidden md:flex">
      <nav class="sidebar-nav">
        {#each navigationItems as item}
          {#if canAccessItem(item.permissions)}
            <a 
              href={item.href}
              class="nav-item"
              class:active={isActiveRoute(item.href)}
              on:click={closeMobileMenu}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d={getIcon(item.icon)}/>
              </svg>
              <span>{item.title}</span>
            </a>
          {/if}
        {/each}
      </nav>
    </aside>

    <!-- Mobile Menu Overlay -->
    {#if isMobileMenuOpen}
      <div class="mobile-overlay md:hidden" on:click={closeMobileMenu}>
        <div class="mobile-menu" on:click|stopPropagation>
          <div class="mobile-menu-header">
            <div class="user-info-mobile">
              <span class="user-name">{user.name}</span>
              <span class="user-role role-{role.name?.toLowerCase()}">{user.roleName}</span>
            </div>
            <button class="close-btn" on:click={closeMobileMenu}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          
          <nav class="mobile-nav">
            {#each navigationItems as item}
              {#if canAccessItem(item.permissions)}
                <a 
                  href={item.href}
                  class="nav-item-mobile"
                  class:active={isActiveRoute(item.href)}
                  on:click={closeMobileMenu}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d={getIcon(item.icon)}/>
                  </svg>
                  <span>{item.title}</span>
                </a>
              {/if}
            {/each}
          </nav>
        </div>
      </div>
    {/if}

    <!-- Main Content -->
    <main class="main-content">
      <slot />
    </main>
  </div>
{:else}
  <div class="error-container">
    <h2>กรุณาเข้าสู่ระบบ</h2>
    <button class="btn-primary" on:click={() => goto('/login')}>
      เข้าสู่ระบบ
    </button>
  </div>
{/if}

<style>
  /* CSS Variables */
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
    --sidebar-width: 280px;
    --topnav-height: 64px;
  }

  /* Layout Structure */
  .app-layout {
    display: grid;
    grid-template-areas: 
      "topnav topnav"
      "sidebar main";
    grid-template-columns: var(--sidebar-width) 1fr;
    grid-template-rows: var(--topnav-height) 1fr;
    min-height: 100vh;
  }

  /* Top Navigation */
  .top-nav {
    grid-area: topnav;
    background: var(--card-bg);
    border-bottom: 1px solid var(--gray-200);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 100;
  }

  .nav-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: var(--topnav-height);
    padding: 0 24px;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: none;
    color: var(--text-primary);
    cursor: pointer;
    border-radius: 8px;
  }

  .mobile-menu-btn:hover {
    background: var(--gray-100);
  }

  .brand-text h1 {
    font-size: 18px;
    font-weight: 600;
    color: var(--primary);
    margin: 0;
  }

  .brand-text span {
    font-size: 12px;
    color: var(--text-secondary);
    display: block;
  }

  .nav-user {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .user-info {
    text-align: right;
  }

  .user-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    display: block;
  }

  .user-role {
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 8px;
    font-weight: 500;
    text-transform: uppercase;
  }

  .role-superuser {
    background: rgba(231, 76, 60, 0.1);
    color: var(--danger);
  }

  .role-admin {
    background: rgba(243, 156, 18, 0.1);
    color: var(--warning);
  }

  .role-user {
    background: rgba(52, 152, 219, 0.1);
    color: var(--info);
  }

  .logout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.15s ease;
  }

  .logout-btn:hover {
    background: var(--gray-100);
    color: var(--text-primary);
  }

  /* Desktop Sidebar */
  .sidebar {
    grid-area: sidebar;
    background: var(--card-bg);
    border-right: 1px solid var(--gray-200);
    overflow-y: auto;
  }

  .sidebar-nav {
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.15s ease;
  }

  .nav-item:hover {
    background: var(--gray-100);
    color: var(--text-primary);
  }

  .nav-item.active {
    background: rgba(22, 160, 133, 0.1);
    color: var(--primary);
  }

  /* Mobile Menu */
  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 200;
    display: flex;
  }

  .mobile-menu {
    background: var(--card-bg);
    width: 280px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .mobile-menu-header {
    padding: 20px;
    border-bottom: 1px solid var(--gray-200);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .user-info-mobile {
    display: flex;
    flex-direction: column;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 8px;
  }

  .close-btn:hover {
    background: var(--gray-100);
  }

  .mobile-nav {
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .nav-item-mobile {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-radius: 8px;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.15s ease;
  }

  .nav-item-mobile:hover {
    background: var(--gray-100);
    color: var(--text-primary);
  }

  .nav-item-mobile.active {
    background: rgba(22, 160, 133, 0.1);
    color: var(--primary);
  }

  /* Main Content */
  .main-content {
    grid-area: main;
    background: var(--background);
    overflow-y: auto;
  }

  /* Loading/Error States */
  .loading-container, .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 16px;
    color: var(--text-secondary);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--gray-200);
    border-top: 3px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .btn-primary {
    padding: 12px 24px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .btn-primary:hover {
    background: #128a71;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .app-layout {
      grid-template-areas: 
        "topnav"
        "main";
      grid-template-columns: 1fr;
      grid-template-rows: var(--topnav-height) 1fr;
    }

    .sidebar {
      display: none;
    }

    .nav-content {
      padding: 0 16px;
    }

    .brand-text h1 {
      font-size: 16px;
    }

    .brand-text span {
      display: none;
    }
  }

  /* Utility Classes */
  .hidden {
    display: none;
  }

  @media (min-width: 768px) {
    .md\:hidden {
      display: none !important;
    }
    
    .md\:block {
      display: block !important;
    }
    
    .md\:flex {
      display: flex !important;
    }
  }
</style>