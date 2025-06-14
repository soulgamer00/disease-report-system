<!-- src/routes/+page.svelte -->
<!-- 🏠 Simple Homepage - Using Existing API Service -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { publicApi, type Disease, handleApiError } from '$lib/services/api';
  import typeSafeConfig from '$lib/config/reportConfigs';

  // ========== STATE ==========
  let diseases: Disease[] = [];
  let isLoading = true;
  let error: string | null = null;

  // ========== LOAD DATA ==========
  async function loadPageData(): Promise<void> {
    try {
      console.log('🏠 Loading homepage data...');
      
      // Use existing API service - no hardcoding!
      const [diseasesResponse] = await Promise.all([
        publicApi.diseases(),
        typeSafeConfig.init() // Initialize config engine
      ]);
      
      if (!diseasesResponse.success) {
        throw new Error(diseasesResponse.message);
      }
      
      diseases = diseasesResponse.data;
      console.log(`✅ Loaded ${diseases.length} diseases`);
      
      if (diseases.length === 0) {
        error = 'ไม่มีข้อมูลโรคในระบบ กรุณาเพิ่มข้อมูลในตาราง disease_card';
      }
      
    } catch (err) {
      console.error('❌ Failed to load data:', err);
      error = handleApiError(err);
    } finally {
      isLoading = false;
    }
  }

  // ========== LIFECYCLE ==========
  onMount(loadPageData);

  // ========== ACTIONS ==========
  function viewDiseaseReport(diseaseId: number): void {
    goto(`/disease/${diseaseId}`);
  }

  function goToLogin(): void {
    goto('/login');
  }

  // ========== UTILS ==========
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getDiseaseIcon(disease: Disease): string {
    return disease.imageUrl || '🦠';
  }

  function truncateText(text: string, maxLength: number = 120): string {
    if (!text) return 'ไม่มีรายละเอียด';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
</script>

<svelte:head>
  <title>หน้าหลัก - {import.meta.env.VITE_APP_NAME}</title>
  <meta name="description" content="ระบบรายงานโรคติดต่อ - ติดตามและวิเคราะห์ข้อมูลโรคติดต่อในประเทศไทย" />
</svelte:head>

<div class="homepage">
  <!-- Navigation -->
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-brand">
        <h1>🏥 {import.meta.env.VITE_APP_NAME}</h1>
      </div>
      <div class="nav-actions">
        <button class="btn btn-outline" on:click={goToLogin}>
          เข้าสู่ระบบ
        </button>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="hero-section">
    <div class="hero-container">
      <div class="hero-content">
        <h1 class="hero-title">ระบบรายงานโรคติดต่อ</h1>
        <p class="hero-subtitle">
          ระบบบันทึก ติดตาม และวิเคราะห์ข้อมูลผู้ป่วยโรคติดต่อ<br>
          เพื่อการเฝ้าระวังและป้องกันโรคที่มีประสิทธิภาพ
        </p>
      </div>
      
      <div class="current-date">
        📅 วันที่ {formatDate(new Date().toISOString())}
      </div>
    </div>
  </section>

  <!-- Diseases Section -->
  <section class="diseases-section">
    <div class="section-container">
      <div class="section-header">
        <h2 class="section-title">รายการโรคติดต่อ</h2>
        <p class="section-subtitle">คลิกเพื่อดูรายงานและสถิติของแต่ละโรค</p>
      </div>

      {#if isLoading}
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">กำลังโหลดข้อมูลโรคติดต่อ...</p>
        </div>
        
      {:else if error}
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <h3>เกิดข้อผิดพลาด</h3>
          <p class="error-message">{error}</p>
          <button class="btn btn-primary" on:click={loadPageData}>
            ลองใหม่อีกครั้ง
          </button>
        </div>
        
      {:else if diseases.length === 0}
        <div class="empty-container">
          <div class="empty-icon">🦠</div>
          <h3>ไม่พบข้อมูลโรคติดต่อ</h3>
          <p>ขณะนี้ยังไม่มีข้อมูลโรคติดต่อในระบบ</p>
        </div>
        
      {:else}
        <div class="diseases-grid">
          {#each diseases as disease}
            <div 
              class="disease-card"
              on:click={() => viewDiseaseReport(disease.id)}
              on:keydown={(e) => e.key === 'Enter' && viewDiseaseReport(disease.id)}
              tabindex="0"
              role="button"
            >
              <div class="card-header">
                <div class="disease-icon">{getDiseaseIcon(disease)}</div>
                <div class="disease-code">รหัส: {disease.daName || disease.id}</div>
              </div>
              
              <div class="card-content">
                <h3 class="disease-name-thai">{disease.thaiName}</h3>
                <p class="disease-name-eng">{disease.engName || ''}</p>
                
                <div class="disease-details">
                  <p>{truncateText(disease.details || '')}</p>
                </div>
              </div>
              
              <div class="card-footer">
                <span class="view-report-btn">
                  ดูรายงานและสถิติ →
                </span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-content">
        <div class="footer-info">
          <h3>ระบบรายงานโรคติดต่อ</h3>
          <p>พัฒนาเพื่อการเฝ้าระวัง ติดตาม และรายงานโรคติดต่อ</p>
        </div>
        <div class="footer-meta">
          <p>เวอร์ชัน {import.meta.env.VITE_APP_VERSION} | Environment: {import.meta.env.VITE_APP_ENV}</p>
        </div>
      </div>
    </div>
  </footer>
</div>

<style>
  .homepage {
    min-height: 100vh;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  }

  .navbar {
    background: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nav-brand h1 {
    color: #0d7b5f;
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    border: none;
  }

  .btn-outline {
    background: transparent;
    color: #0d7b5f;
    border: 2px solid #0d7b5f;
  }

  .btn-outline:hover {
    background: #0d7b5f;
    color: white;
  }

  .btn-primary {
    background: #0d7b5f;
    color: white;
    border: 2px solid #0d7b5f;
  }

  .btn-primary:hover {
    background: #0a5a44;
    border-color: #0a5a44;
  }

  .hero-section {
    padding: 4rem 2rem;
    text-align: center;
  }

  .hero-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .hero-title {
    font-size: 3rem;
    font-weight: 700;
    color: #0d7b5f;
    margin-bottom: 1rem;
  }

  .hero-subtitle {
    font-size: 1.25rem;
    color: #64748b;
    line-height: 1.6;
    margin-bottom: 2rem;
  }

  .current-date {
    background: white;
    padding: 1rem 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    display: inline-block;
    color: #0d7b5f;
    font-weight: 500;
  }

  .diseases-section {
    padding: 4rem 2rem;
  }

  .section-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .section-title {
    font-size: 2.5rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1rem;
  }

  .section-subtitle {
    font-size: 1.125rem;
    color: #64748b;
  }

  .loading-container,
  .error-container,
  .empty-container {
    text-align: center;
    padding: 4rem 2rem;
  }

  .loading-spinner {
    width: 3rem;
    height: 3rem;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #0d7b5f;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-icon,
  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .diseases-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
  }

  .disease-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .disease-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: linear-gradient(135deg, #0d7b5f, #10b981);
    color: white;
  }

  .disease-icon {
    font-size: 2rem;
  }

  .disease-code {
    font-size: 0.875rem;
    opacity: 0.9;
  }

  .card-content {
    padding: 1.5rem;
  }

  .disease-name-thai {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }

  .disease-name-eng {
    font-size: 1rem;
    color: #64748b;
    margin-bottom: 1rem;
  }

  .disease-details {
    color: #374151;
    line-height: 1.6;
  }

  .card-footer {
    padding: 1rem 1.5rem;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
  }

  .view-report-btn {
    color: #0d7b5f;
    font-weight: 500;
  }

  .footer {
    background: #1e293b;
    color: white;
    padding: 2rem 0;
    margin-top: 4rem;
  }

  .footer-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-meta {
    font-size: 0.875rem;
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    .nav-container {
      padding: 1rem;
    }

    .hero-title {
      font-size: 2rem;
    }

    .hero-subtitle {
      font-size: 1rem;
    }

    .diseases-grid {
      grid-template-columns: 1fr;
    }

    .footer-content {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
  }
</style>