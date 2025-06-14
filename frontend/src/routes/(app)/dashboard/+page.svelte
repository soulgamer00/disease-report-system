<!-- src/routes/(app)/dashboard/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authState, userRole } from '$lib/stores/auth';
  import { apiClient } from '$lib/api/client';
  import type { User } from '$lib/api/types';

  // ✅ FIXED: Proper TypeScript interfaces
  interface DashboardStats {
    patients: {
      total: number;
      thisMonth: number;
      growth: number;
    };
    diseases: {
      total: number;
      active: number;
    };
    hospitals: {
      total: number;
      active: number;
    };
    populations: {
      total: number;
      currentYear: number;
    };
  }

  interface RecentPatient {
    id: number;
    name: string;
    disease: string;
    hospital: string;
    date: string;
    status: 'รักษาหาย' | 'กำลังรักษา' | 'วิกฤต';
  }

  interface QuickStat {
    title: string;
    value: number;
    change: number;
    icon: IconName;
    color: StatColor;
    href: string;
  }

  interface NavigationCard {
    title: string;
    description: string;
    icon: IconName;
    href: string;
    color: CardColor;
    permissions?: string[];
    roleRequired?: string | string[];
  }

  type IconName = 'users' | 'activity' | 'building' | 'chart' | 'user-check' | 'bar-chart';
  type StatColor = 'primary' | 'success' | 'info' | 'warning';
  type CardColor = 'primary' | 'success' | 'info' | 'warning' | 'secondary' | 'purple';
  type PatientStatus = 'รักษาหาย' | 'กำลังรักษา' | 'วิกฤต';

  // Reactive subscriptions
  $: user = $authState.user;
  $: role = $userRole;

  // ✅ FIXED: Properly typed state
  let dashboardStats: DashboardStats = {
    patients: { total: 0, thisMonth: 0, growth: 0 },
    diseases: { total: 0, active: 0 },
    hospitals: { total: 0, active: 0 },
    populations: { total: 0, currentYear: 0 }
  };
  
  let recentPatients: RecentPatient[] = [];
  let topDiseases: Array<{ id: number; name: string; count: number }> = [];
  let isLoading = true;
  let error: string | null = null;

  // ✅ FIXED: Properly typed quick stats
  let quickStats: QuickStat[] = [
    {
      title: 'ผู้ป่วยทั้งหมด',
      value: 0,
      change: 0,
      icon: 'users',
      color: 'primary',
      href: '/patients'
    },
    {
      title: 'โรคในระบบ',
      value: 0,
      change: 0,
      icon: 'activity',
      color: 'success',
      href: '/diseases'
    },
    {
      title: 'โรงพยาบาล',
      value: 0,
      change: 0,
      icon: 'building',
      color: 'info',
      href: '/hospitals'
    },
    {
      title: 'ข้อมูลประชากร',
      value: 0,
      change: 0,
      icon: 'chart',
      color: 'warning',
      href: '/populations'
    }
  ];

  // ✅ FIXED: Properly typed navigation cards based on user role
  $: navigationCards = getNavigationCards(role);

  onMount(async () => {
    if (!user) {
      goto('/login');
      return;
    }
    
    await loadDashboardData();
  });

  function getNavigationCards(userRole: typeof role): NavigationCard[] {
    const allCards: NavigationCard[] = [
      {
        title: 'จัดการข้อมูลผู้ป่วย',
        description: 'บันทึกและจัดการข้อมูลผู้ป่วยโรคติดต่อโดยแมลง',
        icon: 'users',
        href: '/patients',
        color: 'primary',
        permissions: ['PATIENT_VIEW_ALL', 'PATIENT_VIEW_OWN']
      },
      {
        title: 'จัดการข้อมูลโรค',
        description: 'จัดการข้อมูลโรคติดต่อและอาการต่างๆ',
        icon: 'activity',
        href: '/diseases',
        color: 'success',
        permissions: ['DISEASE_VIEW'],
        roleRequired: 'SUPERUSER'
      },
      {
        title: 'จัดการโรงพยาบาล',
        description: 'จัดการข้อมูลโรงพยาบาลและหน่วยงาน',
        icon: 'building',
        href: '/hospitals',
        color: 'info',
        permissions: ['HOSPITAL_VIEW'],
        roleRequired: ['ADMIN', 'SUPERUSER']
      },
      {
        title: 'จัดการข้อมูลประชากร',
        description: 'จัดการข้อมูลประชากรสำหรับคำนวณอัตราป่วย',
        icon: 'chart',
        href: '/populations',
        color: 'warning',
        permissions: ['POPULATION_VIEW'],
        roleRequired: ['ADMIN', 'SUPERUSER']
      },
      {
        title: 'จัดการผู้ใช้งาน',
        description: 'จัดการบัญชีผู้ใช้งานและสิทธิ์การเข้าถึง',
        icon: 'user-check',
        href: '/users',
        color: 'secondary',
        permissions: ['USER_VIEW'],
        roleRequired: ['ADMIN', 'SUPERUSER']
      },
      {
        title: 'รายงานและสถิติ',
        description: 'ดูรายงานสถิติและวิเคราะห์ข้อมูล',
        icon: 'bar-chart',
        href: '/reports',
        color: 'purple',
        permissions: ['REPORT_VIEW_ALL', 'REPORT_VIEW_OWN']
      }
    ];

    return allCards.filter(card => {
      if (card.roleRequired) {
        if (Array.isArray(card.roleRequired)) {
          return card.roleRequired.includes(userRole.name);
        }
        return userRole.name === card.roleRequired;
      }
      return true; // Show if no specific role requirement
    });
  }

  async function loadDashboardData(): Promise<void> {
    try {
      isLoading = true;
      error = null;

      // Load stats based on user permissions
      const promises: Promise<void>[] = [];

      // Always try to load basic stats
      if (role.isAdmin || role.isSuperuser) {
        promises.push(loadPatientStats());
        promises.push(loadDiseaseStats());
        promises.push(loadHospitalStats());
        promises.push(loadPopulationStats());
        promises.push(loadRecentPatients());
      } else {
        // For USER role, load only accessible data
        promises.push(loadPatientStats());
        promises.push(loadRecentPatients());
      }

      await Promise.allSettled(promises);
      updateQuickStats();

    } catch (err) {
      console.error('Dashboard load error:', err);
      error = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
    } finally {
      isLoading = false;
    }
  }

  async function loadPatientStats(): Promise<void> {
    try {
      // ✅ TODO: Replace with real API call
      // const response = await apiClient.getPatientStats();
      dashboardStats.patients = {
        total: 1247,
        thisMonth: 89,
        growth: 12.5
      };
    } catch (err) {
      console.error('Patient stats error:', err);
    }
  }

  async function loadDiseaseStats(): Promise<void> {
    try {
      // ✅ TODO: Replace with real API call
      // const response = await apiClient.getDiseaseStats();
      dashboardStats.diseases = {
        total: 15,
        active: 12
      };
    } catch (err) {
      console.error('Disease stats error:', err);
    }
  }

  async function loadHospitalStats(): Promise<void> {
    try {
      // ✅ TODO: Replace with real API call
      // const response = await apiClient.getHospitalStats();
      dashboardStats.hospitals = {
        total: 28,
        active: 26
      };
    } catch (err) {
      console.error('Hospital stats error:', err);
    }
  }

  async function loadPopulationStats(): Promise<void> {
    try {
      // ✅ TODO: Replace with real API call
      // const response = await apiClient.getPopulationStats();
      dashboardStats.populations = {
        total: 156,
        currentYear: 2024
      };
    } catch (err) {
      console.error('Population stats error:', err);
    }
  }

  async function loadRecentPatients(): Promise<void> {
    try {
      // ✅ TODO: Replace with real API call
      // const response = await apiClient.getRecentPatients();
      recentPatients = [
        {
          id: 1,
          name: 'นายสมชาย ใจดี',
          disease: 'ไข้เลือดออก',
          hospital: 'รพ.วิเชียรบุรี',
          date: '2024-06-01',
          status: 'รักษาหาย'
        },
        {
          id: 2,
          name: 'นางสาวมาลี สวยงาม',
          disease: 'ไข้จับสั่น',
          hospital: 'รพ.สต.ท่าโรง',
          date: '2024-05-30',
          status: 'กำลังรักษา'
        },
        {
          id: 3,
          name: 'นายประยุทธ เก่งมาก',
          disease: 'ไข้ชิคุนกุนยา',
          hospital: 'รพ.พิษณุโลก',
          date: '2024-05-28',
          status: 'รักษาหาย'
        }
      ];
    } catch (err) {
      console.error('Recent patients error:', err);
    }
  }

  function updateQuickStats(): void {
    quickStats = [
      {
        title: 'ผู้ป่วยทั้งหมด',
        value: dashboardStats.patients.total,
        change: dashboardStats.patients.growth,
        icon: 'users',
        color: 'primary',
        href: '/patients'
      },
      {
        title: 'โรคในระบบ',
        value: dashboardStats.diseases.total,
        change: 0,
        icon: 'activity',
        color: 'success',
        href: '/diseases'
      },
      {
        title: 'โรงพยาบาล',
        value: dashboardStats.hospitals.total,
        change: 0,
        icon: 'building',
        color: 'info',
        href: '/hospitals'
      },
      {
        title: 'ข้อมูลประชากร',
        value: dashboardStats.populations.total,
        change: 0,
        icon: 'chart',
        color: 'warning',
        href: '/populations'
      }
    ];
  }

  function handleCardClick(href: string): void {
    goto(href);
  }

  function formatNumber(num: number): string {
    return new Intl.NumberFormat('th-TH').format(num);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getIcon(iconName: IconName): string {
    const icons: Record<IconName, string> = {
      'users': 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
      'activity': 'M22 12h-4l-3 9L9 3l-3 9H2',
      'building': 'M6 2v20h8V2H6zM3 8h3v14H3V8zM15 8h6v14h-6V8z',
      'chart': 'M18 20V10M12 20V4M6 20v-6',
      'user-check': 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12.5 11.5L15 14l3-3M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
      'bar-chart': 'M12 20V10M18 20V4M6 20v-4'
    };
    return icons[iconName];
  }

  function getStatusColor(status: PatientStatus): string {
    const statusColorMap: Record<PatientStatus, string> = {
      'รักษาหาย': 'success',
      'กำลังรักษา': 'warning',
      'วิกฤต': 'danger'
    };
    return statusColorMap[status] || 'secondary';
  }

  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'สวัสดีตอนเช้า';
    if (hour < 17) return 'สวัสดีตอนบ่าย';
    return 'สวัสดีตอนเย็น';
  }
</script>

<svelte:head>
  <title>หน้าหลัก - ระบบเฝ้าระวังโรคติดต่อโดยแมลง</title>
</svelte:head>

<div class="dashboard">
  <!-- Header Section -->
  <header class="dashboard-header">
    <div class="welcome-section">
      <h1>{getGreeting()}</h1>
      <p>
        {#if user}
          ยินดีต้อนรับ <strong>{user.name}</strong> 
          ({user.roleName})
          {#if role.isUser && user.hospitalName}
            • {user.hospitalName}
          {/if}
        {/if}
      </p>
    </div>
    
    <div class="date-info">
      <span class="current-date">
        {new Date().toLocaleDateString('th-TH', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </span>
    </div>
  </header>

  <!-- Error State -->
  {#if error}
    <div class="alert alert-error">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <span>{error}</span>
      <button class="retry-btn" on:click={loadDashboardData}>
        ลองใหม่
      </button>
    </div>
  {/if}

  <!-- Loading State -->
  {#if isLoading}
    <div class="loading-container">
      <div class="spinner"></div>
      <p>กำลังโหลดข้อมูลแดชบอร์ด...</p>
    </div>
  {:else}
    <!-- Quick Stats -->
    <section class="stats-section">
      <h2>สถิติภาพรวม</h2>
      <div class="stats-grid">
        {#each quickStats as stat}
          <button 
            class="stat-card {stat.color}"
            on:click={() => handleCardClick(stat.href)}
          >
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d={getIcon(stat.icon)}/>
              </svg>
            </div>
            <div class="stat-content">
              <h3>{stat.title}</h3>
              <p class="stat-number">{formatNumber(stat.value)}</p>
              {#if stat.change > 0}
                <span class="stat-change positive">
                  ↑ {stat.change}%
                </span>
              {:else if stat.change < 0}
                <span class="stat-change negative">
                  ↓ {Math.abs(stat.change)}%
                </span>
              {/if}
            </div>
          </button>
        {/each}
      </div>
    </section>

    <!-- Navigation Cards -->
    <section class="navigation-section">
      <h2>เมนูหลัก</h2>
      <div class="nav-grid">
        {#each navigationCards as card}
          <button 
            class="nav-card {card.color}"
            on:click={() => handleCardClick(card.href)}
          >
            <div class="nav-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d={getIcon(card.icon)}/>
              </svg>
            </div>
            <div class="nav-content">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
            <div class="nav-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </button>
        {/each}
      </div>
    </section>

    <!-- Recent Activity -->
    <section class="activity-section">
      <h2>กิจกรรมล่าสุด</h2>
      <div class="activity-content">
        <!-- Recent Patients -->
        <div class="activity-card">
          <div class="activity-header">
            <h3>ผู้ป่วยล่าสุด</h3>
            <button class="view-all-btn" on:click={() => goto('/patients')}>
              ดูทั้งหมด →
            </button>
          </div>
          
          {#if recentPatients.length > 0}
            <div class="patient-list">
              {#each recentPatients as patient}
                <div class="patient-item">
                  <div class="patient-info">
                    <h4>{patient.name}</h4>
                    <p class="patient-details">
                      <span class="disease">{patient.disease}</span>
                      <span class="separator">•</span>
                      <span class="hospital">{patient.hospital}</span>
                    </p>
                    <span class="patient-date">{formatDate(patient.date)}</span>
                  </div>
                  <span class="status-badge {getStatusColor(patient.status)}">
                    {patient.status}
                  </span>
                </div>
              {/each}
            </div>
          {:else}
            <div class="empty-state">
              <p>ยังไม่มีข้อมูลผู้ป่วยล่าสุด</p>
            </div>
          {/if}
        </div>

        <!-- Quick Actions -->
        <div class="activity-card">
          <div class="activity-header">
            <h3>การกระทำด่วน</h3>
          </div>
          
          <div class="quick-actions">
            <button 
              class="quick-action-btn primary"
              on:click={() => goto('/patients/new')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              เพิ่มผู้ป่วยใหม่
            </button>
            
            {#if role.isAdmin || role.isSuperuser}
              <button 
                class="quick-action-btn secondary"
                on:click={() => goto('/populations/new')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 20V10M12 20V4M6 20v-6"/>
                </svg>
                เพิ่มข้อมูลประชากร
              </button>
            {/if}

            <button 
              class="quick-action-btn outline"
              on:click={() => goto('/reports')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 11H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h4M15 11h4a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-4M12 11V7a4 4 0 1 0-8 0v4"/>
              </svg>
              ดูรายงาน
            </button>
          </div>
        </div>
      </div>
    </section>
  {/if}
</div>

<style>
  /* CSS Variables - Design System */
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
    --secondary: #95a5a6;
    --purple: #9b59b6;
    --gray-100: #f1f3f4;
    --gray-200: #e9ecef;
    --gray-300: #dee2e6;
    --border-radius: 8px;
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    --spacing-2xl: 48px;
  }

  /* Layout */
  .dashboard {
    min-height: 100vh;
    background: var(--background);
    padding: var(--spacing-lg);
  }

  /* Header */
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-2xl);
    gap: var(--spacing-lg);
  }

  .welcome-section h1 {
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }

  .welcome-section p {
    font-size: 16px;
    color: var(--text-secondary);
    margin: 0;
  }

  .welcome-section strong {
    color: var(--primary);
    font-weight: 600;
  }

  .current-date {
    font-size: 14px;
    color: var(--text-secondary);
    background: var(--card-bg);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  /* Sections */
  .stats-section,
  .navigation-section,
  .activity-section {
    margin-bottom: var(--spacing-2xl);
  }

  .stats-section h2,
  .navigation-section h2,
  .activity-section h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-lg);
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-lg);
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background: var(--card-bg);
    border: none;
    border-radius: var(--border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-card.primary .stat-icon {
    background: rgba(22, 160, 133, 0.1);
    color: var(--primary);
  }

  .stat-card.success .stat-icon {
    background: rgba(39, 174, 96, 0.1);
    color: var(--success);
  }

  .stat-card.info .stat-icon {
    background: rgba(52, 152, 219, 0.1);
    color: var(--info);
  }

  .stat-card.warning .stat-icon {
    background: rgba(243, 156, 18, 0.1);
    color: var(--warning);
  }

  .stat-content h3 {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xs);
    font-weight: 500;
  }

  .stat-number {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }

  .stat-change {
    font-size: 12px;
    font-weight: 500;
  }

  .stat-change.positive {
    color: var(--success);
  }

  .stat-change.negative {
    color: var(--danger);
  }

  /* Navigation Grid */
  .nav-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-lg);
  }

  .nav-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    padding: var(--spacing-xl);
    background: var(--card-bg);
    border: none;
    border-radius: var(--border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  .nav-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
  }

  .nav-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    transition: all 0.2s ease;
  }

  .nav-card.primary::before { background: var(--primary); }
  .nav-card.success::before { background: var(--success); }
  .nav-card.info::before { background: var(--info); }
  .nav-card.warning::before { background: var(--warning); }
  .nav-card.secondary::before { background: var(--secondary); }
  .nav-card.purple::before { background: var(--purple); }

  .nav-icon {
    width: 56px;
    height: 56px;
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .nav-card.primary .nav-icon {
    background: rgba(22, 160, 133, 0.1);
    color: var(--primary);
  }

  .nav-card.success .nav-icon {
    background: rgba(39, 174, 96, 0.1);
    color: var(--success);
  }

  .nav-card.info .nav-icon {
    background: rgba(52, 152, 219, 0.1);
    color: var(--info);
  }

  .nav-card.warning .nav-icon {
    background: rgba(243, 156, 18, 0.1);
    color: var(--warning);
  }

  .nav-card.secondary .nav-icon {
    background: rgba(149, 165, 166, 0.1);
    color: var(--secondary);
  }

  .nav-card.purple .nav-icon {
    background: rgba(155, 89, 182, 0.1);
    color: var(--purple);
  }

  .nav-content {
    flex: 1;
  }

  .nav-content h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }

  .nav-content p {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.4;
  }

  .nav-arrow {
    color: var(--text-secondary);
    opacity: 0;
    transform: translateX(-8px);
    transition: all 0.2s ease;
  }

  .nav-card:hover .nav-arrow {
    opacity: 1;
    transform: translateX(0);
  }

  /* Activity Section */
  .activity-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--spacing-lg);
  }

  .activity-card {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .activity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--gray-200);
  }

  .activity-header h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .view-all-btn {
    background: none;
    border: none;
    color: var(--primary);
    font-size: 14px;
    cursor: pointer;
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .view-all-btn:hover {
    color: #128a71;
  }

  /* Patient List */
  .patient-list {
    padding: var(--spacing-lg);
  }

  .patient-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md) 0;
    border-bottom: 1px solid var(--gray-200);
  }

  .patient-item:last-child {
    border-bottom: none;
  }

  .patient-info h4 {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-xs) 0;
  }

  .patient-details {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 0 var(--spacing-xs) 0;
  }

  .patient-details .disease {
    font-weight: 500;
    color: var(--text-primary);
  }

  .patient-details .separator {
    margin: 0 var(--spacing-sm);
  }

  .patient-date {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .status-badge {
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .status-badge.success {
    background: rgba(39, 174, 96, 0.1);
    color: var(--success);
  }

  .status-badge.warning {
    background: rgba(243, 156, 18, 0.1);
    color: var(--warning);
  }

  .status-badge.danger {
    background: rgba(231, 76, 60, 0.1);
    color: var(--danger);
  }

  .status-badge.secondary {
    background: var(--gray-200);
    color: var(--text-secondary);
  }

  /* Quick Actions */
  .quick-actions {
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .quick-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-lg);
    border: none;
    border-radius: var(--border-radius);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    min-height: 44px;
    text-decoration: none;
  }

  .quick-action-btn.primary {
    background: var(--primary);
    color: white;
  }

  .quick-action-btn.primary:hover {
    background: #128a71;
    box-shadow: 0 4px 15px rgba(22, 160, 133, 0.3);
  }

  .quick-action-btn.secondary {
    background: var(--secondary);
    color: white;
  }

  .quick-action-btn.secondary:hover {
    background: #7f8c8d;
  }

  .quick-action-btn.outline {
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--gray-300);
  }

  .quick-action-btn.outline:hover {
    background: var(--gray-100);
  }

  /* Empty State */
  .empty-state {
    padding: var(--spacing-xl);
    text-align: center;
    color: var(--text-secondary);
  }

  .empty-state p {
    margin: 0;
    font-size: 14px;
  }

  /* Loading States */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-2xl);
    gap: var(--spacing-md);
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

  /* Alerts */
  .alert {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-lg);
  }

  .alert-error {
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.2);
    color: var(--danger);
  }

  .retry-btn {
    background: var(--danger);
    color: white;
    border: none;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius);
    font-size: 12px;
    cursor: pointer;
    margin-left: auto;
  }

  .retry-btn:hover {
    background: #c0392b;
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .activity-content {
      grid-template-columns: 1fr;
    }

    .nav-grid {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }
  }

  @media (max-width: 768px) {
    .dashboard {
      padding: var(--spacing-md);
    }

    .dashboard-header {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-md);
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .nav-grid {
      grid-template-columns: 1fr;
    }

    .nav-card {
      padding: var(--spacing-lg);
    }

    .nav-card .nav-icon {
      width: 48px;
      height: 48px;
    }

    .patient-item {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-sm);
    }

    .activity-content {
      gap: var(--spacing-md);
    }
  }

  @media (max-width: 640px) {
    .welcome-section h1 {
      font-size: 24px;
    }

    .stat-card,
    .nav-card {
      padding: var(--spacing-md);
    }

    .stat-card {
      flex-direction: column;
      text-align: center;
      gap: var(--spacing-sm);
    }

    .nav-card {
      flex-direction: column;
      text-align: center;
      gap: var(--spacing-md);
    }

    .nav-arrow {
      display: none;
    }

    .patient-details {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .patient-details .separator {
      display: none;
    }

    .quick-actions {
      gap: var(--spacing-sm);
    }
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .stat-card,
    .nav-card,
    .quick-action-btn,
    .spinner {
      transition: none;
      animation: none;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .stat-card,
    .nav-card,
    .activity-card {
      border: 2px solid var(--text-primary);
    }

    .stat-icon,
    .nav-icon {
      border: 1px solid currentColor;
    }
  }

  /* Dark mode support (future enhancement) */
  @media (prefers-color-scheme: dark) {
    :root {
      --background: #1a1a1a;
      --card-bg: #2d2d2d;
      --text-primary: #ffffff;
      --text-secondary: #b0b0b0;
      --gray-100: #404040;
      --gray-200: #505050;
      --gray-300: #606060;
    }
  }

  /* Print styles */
  @media print {
    .dashboard {
      background: white;
      color: black;
    }

    .stat-card,
    .nav-card,
    .activity-card {
      box-shadow: none;
      border: 1px solid #ccc;
    }

    .nav-arrow,
    .quick-actions {
      display: none;
    }
  }
</style>