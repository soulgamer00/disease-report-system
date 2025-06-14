<!-- src/routes/(app)/diseases/edit/[id]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import {
    diseaseFormState,
    updateDisease,
    loadDiseaseById,
    checkDiseaseNameAvailability,
    clearDiseaseFormErrors,
    validateDiseaseData
  } from '$lib/stores/diseaseStore';
  import { authState, userRole } from '$lib/stores/auth';
  import type { UpdateDiseaseData, Disease } from '$lib/api/types';

  // Get disease ID from URL
  $: diseaseId = parseInt($page.params.id);

  // Reactive subscriptions
  $: formState = $diseaseFormState;
  $: user = $authState.user;
  $: role = $userRole;

  // Component state
  let currentDisease: Disease | null = null;
  let formData: UpdateDiseaseData = {};
  let originalData: Disease | null = null;
  let isLoading = true;
  let loadError: string | null = null;

  // Form display values
  let displayThaiName = '';
  let displayEngName = '';
  let displayDaName = '';
  let displayDetails = '';
  let displayImageUrl = '';

  // Validation
  let fieldErrors: Record<string, string> = {};
  let isFormValid = false;
  let hasChanges = false;

  // Name availability checking
  let thaiNameAvailable = true;
  let engNameAvailable = true;
  let checkingNameAvailability = false;
  let nameCheckTimeout: any = null;

  // Reactive declarations for character counts (แก้ไขตรงนี้)
  $: thaiNameCharCount = getCharacterCount(displayThaiName, 100);
  $: engNameCharCount = getCharacterCount(displayEngName, 100);
  $: daNameCharCount = getCharacterCount(displayDaName, 25);
  $: detailsCharCount = getCharacterCount(displayDetails, 1000);


  onMount(async () => {
    // Check permissions - Only SUPERUSER can manage diseases
    if (!role.isSuperuser) {
      goto('/dashboard');
      return;
    }

    // Validate disease ID
    if (isNaN(diseaseId) || diseaseId <= 0) {
      goto('/diseases');
      return;
    }

    try {
      // Load disease data
      const disease = await loadDiseaseById(diseaseId);

      if (disease) {
        currentDisease = disease;
        originalData = { ...disease };

        // Initialize form with current values
        displayThaiName = disease.thaiName;
        displayEngName = disease.engName || '';
        displayDaName = disease.daName || '';
        displayDetails = disease.details || '';
        displayImageUrl = disease.imageUrl || '';

        thaiNameAvailable = true;
        engNameAvailable = true;
        validateForm();
      } else {
        loadError = 'ไม่พบข้อมูลโรคที่ต้องการแก้ไข';
      }
    } catch (error) {
      console.error('Failed to load disease data:', error);
      loadError = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
    } finally {
      isLoading = false;
    }
  });

  // Check for changes
  $: if (originalData) {
    hasChanges = (
      displayThaiName !== originalData.thaiName ||
      displayEngName !== (originalData.engName || '') ||
      displayDaName !== (originalData.daName || '') ||
      displayDetails !== (originalData.details || '') ||
      displayImageUrl !== (originalData.imageUrl || '')
    );

    // Update form data with only changed values
    formData = {};
    if (displayThaiName !== originalData.thaiName) formData.thaiName = displayThaiName;
    if (displayEngName !== (originalData.engName || '')) formData.engName = displayEngName || undefined;
    if (displayDaName !== (originalData.daName || '')) formData.daName = displayDaName || undefined;
    if (displayDetails !== (originalData.details || '')) formData.details = displayDetails || undefined;
    if (displayImageUrl !== (originalData.imageUrl || '')) formData.imageUrl = displayImageUrl || undefined;
  }

  // Form validation
  function validateForm(): boolean {
    if (!displayThaiName.trim()) {
      isFormValid = false;
      return false;
    }

    const tempData = {
      thaiName: displayThaiName,
      engName: displayEngName || undefined,
      daName: displayDaName || undefined,
      details: displayDetails || undefined,
      imageUrl: displayImageUrl || undefined
    };

    const errors = validateDiseaseData(tempData);

    // Additional validation for name availability
    if (displayThaiName.trim() && !thaiNameAvailable) {
      errors.thaiName = 'ชื่อโรคนี้มีอยู่ในระบบแล้ว';
    }

    if (displayEngName.trim() && !engNameAvailable) {
      errors.engName = 'ชื่อโรคภาษาอังกฤษนี้มีอยู่ในระบบแล้ว';
    }

    fieldErrors = errors;
    isFormValid = Object.keys(errors).length === 0 && thaiNameAvailable && engNameAvailable;

    return isFormValid;
  }

  // Name availability checking with debounce
  async function checkNameAvailability() {
    if (checkingNameAvailability || !originalData) return;

    // Skip if thai name is empty
    if (!displayThaiName.trim()) {
      thaiNameAvailable = true;
      engNameAvailable = true;
      return;
    }

    // Skip if names haven't changed
    if (displayThaiName === originalData.thaiName &&
        displayEngName === (originalData.engName || '')) {
      thaiNameAvailable = true;
      engNameAvailable = true;
      return;
    }

    try {
      checkingNameAvailability = true;

      const result = await checkDiseaseNameAvailability(
        displayThaiName.trim(),
        displayEngName?.trim() || undefined,
        diseaseId // Exclude current disease from check
      );

      if (result) {
        thaiNameAvailable = result.availability.thaiNameAvailable;
        engNameAvailable = result.availability.engNameAvailable;
        validateForm();
      }
    } catch (error) {
      console.error('Name availability check failed:', error);
      // Don't block form submission if check fails
      thaiNameAvailable = true;
      engNameAvailable = true;
    } finally {
      checkingNameAvailability = false;
    }
  }

  function scheduleNameCheck() {
    if (nameCheckTimeout) {
      clearTimeout(nameCheckTimeout);
    }

    nameCheckTimeout = setTimeout(() => {
      checkNameAvailability();
    }, 500); // 500ms debounce
  }

  function clearFieldError(field: string) {
    if (fieldErrors[field]) {
      delete fieldErrors[field];
      fieldErrors = { ...fieldErrors };
    }
  }

  // Form handlers
  function handleThaiNameInput(event: Event) {
    const target = event.target as HTMLInputElement;
    displayThaiName = target.value;
    clearFieldError('thaiName');
    scheduleNameCheck();
    validateForm();
  }

  function handleEngNameInput(event: Event) {
    const target = event.target as HTMLInputElement;
    displayEngName = target.value;
    clearFieldError('engName');
    scheduleNameCheck();
    validateForm();
  }

  function handleDaNameInput(event: Event) {
    const target = event.target as HTMLInputElement;
    displayDaName = target.value;
    clearFieldError('daName');
    validateForm();
  }

  function handleDetailsInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    displayDetails = target.value;
    clearFieldError('details');
    validateForm();
  }

  function handleImageUrlInput(event: Event) {
    const target = event.target as HTMLInputElement;
    displayImageUrl = target.value;
    clearFieldError('imageUrl');
    validateForm();
  }

  // Form submission
  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!validateForm() || !hasChanges) {
      return;
    }

    clearDiseaseFormErrors();

    const result = await updateDisease(diseaseId, formData);

    if (result) {
      goto('/diseases');
    }
  }

  function handleCancel() {
    goto('/diseases');
  }

  // Character count helpers
  function getCharacterCount(text: string, max: number): { count: number; max: number; isNearLimit: boolean; isOverLimit: boolean } {
    const count = text.length;
    return {
      count,
      max,
      isNearLimit: count >= max * 0.8,
      isOverLimit: count > max
    };
  }

  // Utility functions
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<svelte:head>
  <title>แก้ไขข้อมูลโรค - ระบบเฝ้าระวังโรคติดต่อโดยแมลง</title>
</svelte:head>

<div class="disease-edit-page">
  <header class="page-header">
    <div class="header-content">
      <div class="breadcrumb">
        <button class="breadcrumb-link" on:click={() => goto('/diseases')}>
          จัดการข้อมูลโรค
        </button>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">แก้ไขข้อมูล</span>
      </div>

      <div class="title-section">
        <h1>แก้ไขข้อมูลโรค</h1>
        <p>แก้ไขข้อมูลโรคติดต่อโดยแมลงในระบบ</p>
      </div>
    </div>
  </header>

  {#if isLoading}
    <div class="loading-container">
      <div class="spinner"></div>
      <p>กำลังโหลดข้อมูลโรค...</p>
    </div>

  {:else if loadError}
    <div class="error-container">
      <div class="error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h3>เกิดข้อผิดพลาด</h3>
      <p>{loadError}</p>
      <button class="btn btn-primary" on:click={() => goto('/diseases')}>
        กลับไปหน้ารายการ
      </button>
    </div>

  {:else if currentDisease}
    <div class="form-container">
      <div class="current-data-section">
        <h2>ข้อมูลปัจจุบัน</h2>
        <div class="current-data-grid">
          <div class="data-item">
            <span class="data-label">ชื่อโรค (ไทย):</span>
            <span class="data-value">{currentDisease.thaiName}</span>
          </div>
          <div class="data-item">
            <span class="data-label">ชื่อโรค (อังกฤษ):</span>
            <span class="data-value">{currentDisease.engName || '-'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">รหัสโรค:</span>
            <span class="data-value">{currentDisease.daName || '-'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">จำนวนอาการ:</span>
            <span class="data-value">{currentDisease.symptoms?.length || 0} อาการ</span>
          </div>
          <div class="data-item">
            <span class="data-label">สถานะ:</span>
            <span class="data-value status-{currentDisease.isActive ? 'active' : 'inactive'}">
              {currentDisease.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
            </span>
          </div>
          <div class="data-item">
            <span class="data-label">แก้ไขล่าสุด:</span>
            <span class="data-value">{formatDate(currentDisease.updatedAt)}</span>
          </div>
          <div class="data-item">
            <span class="data-label">ผู้แก้ไข:</span>
            <span class="data-value">{currentDisease.updatedBy || 'ไม่ระบุ'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">สร้างเมื่อ:</span>
            <span class="data-value">{formatDate(currentDisease.createdAt)}</span>
          </div>
        </div>
      </div>

      <form class="disease-form" on:submit={handleSubmit}>
        <div class="form-section">
          <h2>แก้ไขข้อมูล</h2>

          <div class="form-grid">
            <div class="form-group">
              <label for="thai-name" class="required">ชื่อโรคภาษาไทย</label>
              <div class="input-with-status">
                <input
                  id="thai-name"
                  type="text"
                  placeholder="เช่น ไข้เลือดออก"
                  value={displayThaiName}
                  on:input={handleThaiNameInput}
                  class:error={fieldErrors.thaiName}
                  class:checking={checkingNameAvailability}
                  class:available={displayThaiName.trim() && thaiNameAvailable}
                  class:unavailable={displayThaiName.trim() && !thaiNameAvailable}
                  disabled={formState.isSubmitting}
                  maxlength="100"
                />

                {#if checkingNameAvailability}
                  <div class="input-status checking">
                    <div class="spinner"></div>
                  </div>
                {:else if displayThaiName.trim() && displayThaiName !== originalData?.thaiName}
                  <div class="input-status {thaiNameAvailable ? 'available' : 'unavailable'}">
                    {#if thaiNameAvailable}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 6 9 17l-5-5"/>
                      </svg>
                    {:else}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    {/if}
                  </div>
                {/if}
              </div>

              <div class="field-meta">
                <span class="field-help">ชื่อโรคในภาษาไทยที่ใช้ในการแสดงผล</span>
                <span class="char-count" class:near-limit={thaiNameCharCount.isNearLimit} class:over-limit={thaiNameCharCount.isOverLimit}>
                  {thaiNameCharCount.count}/{thaiNameCharCount.max}
                </span>
              </div>

              {#if fieldErrors.thaiName}
                <span class="error-message">{fieldErrors.thaiName}</span>
              {/if}
            </div>

            <div class="form-group">
              <label for="eng-name">ชื่อโรคภาษาอังกฤษ</label>
              <div class="input-with-status">
                <input
                  id="eng-name"
                  type="text"
                  placeholder="เช่น Dengue Fever"
                  value={displayEngName}
                  on:input={handleEngNameInput}
                  class:error={fieldErrors.engName}
                  class:available={displayEngName.trim() && engNameAvailable}
                  class:unavailable={displayEngName.trim() && !engNameAvailable}
                  disabled={formState.isSubmitting}
                  maxlength="100"
                />

                {#if displayEngName.trim() && displayEngName !== (originalData?.engName || '') && !checkingNameAvailability}
                  <div class="input-status {engNameAvailable ? 'available' : 'unavailable'}">
                    {#if engNameAvailable}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 6 9 17l-5-5"/>
                      </svg>
                    {:else}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    {/if}
                  </div>
                {/if}
              </div>

              <div class="field-meta">
                <span class="field-help">ชื่อโรคในภาษาอังกฤษ (ไม่บังคับ)</span>
                <span class="char-count" class:near-limit={engNameCharCount.isNearLimit} class:over-limit={engNameCharCount.isOverLimit}>
                  {engNameCharCount.count}/{engNameCharCount.max}
                </span>
              </div>

              {#if fieldErrors.engName}
                <span class="error-message">{fieldErrors.engName}</span>
              {/if}
            </div>
          </div>

          <div class="form-group">
            <label for="da-name">รหัสโรค</label>
            <input
              id="da-name"
              type="text"
              placeholder="เช่น DF, CHIK, ZIKA"
              value={displayDaName}
              on:input={handleDaNameInput}
              class:error={fieldErrors.daName}
              disabled={formState.isSubmitting}
              maxlength="25"
            />

            <div class="field-meta">
              <span class="field-help">รหัสย่อของโรค (ไม่บังคับ)</span>
              <span class="char-count" class:near-limit={daNameCharCount.isNearLimit} class:over-limit={daNameCharCount.isOverLimit}>
                {daNameCharCount.count}/{daNameCharCount.max}
              </span>
            </div>

            {#if fieldErrors.daName}
              <span class="error-message">{fieldErrors.daName}</span>
            {/if}
          </div>

          <div class="form-group">
            <label for="details">รายละเอียดโรค</label>
            <textarea
              id="details"
              placeholder="อธิบายลักษณะของโรค อาการ วิธีการแพร่กระจาย และข้อมูลสำคัญอื่นๆ"
              value={displayDetails}
              on:input={handleDetailsInput}
              class:error={fieldErrors.details}
              disabled={formState.isSubmitting}
              rows="5"
              maxlength="1000"
            ></textarea>

            <div class="field-meta">
              <span class="field-help">รายละเอียดและข้อมูลเพิ่มเติมเกี่ยวกับโรค (ไม่บังคับ)</span>
              <span class="char-count" class:near-limit={detailsCharCount.isNearLimit} class:over-limit={detailsCharCount.isOverLimit}>
                {detailsCharCount.count}/{detailsCharCount.max}
              </span>
            </div>

            {#if fieldErrors.details}
              <span class="error-message">{fieldErrors.details}</span>
            {/if}
          </div>

          <div class="form-group">
            <label for="image-url">URL รูปภาพ</label>
            <input
              id="image-url"
              type="url"
              placeholder="https://example.com/disease-image.jpg"
              value={displayImageUrl}
              on:input={handleImageUrlInput}
              class:error={fieldErrors.imageUrl}
              disabled={formState.isSubmitting}
            />
            <span class="field-help">ลิงก์รูปภาพประกอบของโรค (ไม่บังคับ)</span>

            {#if fieldErrors.imageUrl}
              <span class="error-message">{fieldErrors.imageUrl}</span>
            {/if}
          </div>
        </div>

        {#if hasChanges}
          <div class="changes-section">
            <h3>การเปลี่ยนแปลง</h3>
            <div class="changes-grid">
              {#if formData.thaiName && formData.thaiName !== originalData?.thaiName}
                <div class="change-item">
                  <span class="change-label">ชื่อโรค (ไทย):</span>
                  <span class="change-old">{originalData?.thaiName}</span>
                  <span class="change-arrow">→</span>
                  <span class="change-new">{formData.thaiName}</span>
                </div>
              {/if}

              {#if formData.engName !== undefined && formData.engName !== (originalData?.engName || '')}
                <div class="change-item">
                  <span class="change-label">ชื่อโรค (อังกฤษ):</span>
                  <span class="change-old">{originalData?.engName || '-'}</span>
                  <span class="change-arrow">→</span>
                  <span class="change-new">{formData.engName || '-'}</span>
                </div>
              {/if}

              {#if formData.daName !== undefined && formData.daName !== (originalData?.daName || '')}
                <div class="change-item">
                  <span class="change-label">รหัสโรค:</span>
                  <span class="change-old">{originalData?.daName || '-'}</span>
                  <span class="change-arrow">→</span>
                  <span class="change-new">{formData.daName || '-'}</span>
                </div>
              {/if}

              {#if formData.details !== undefined && formData.details !== (originalData?.details || '')}
                <div class="change-item">
                  <span class="change-label">รายละเอียด:</span>
                  <span class="change-old">{originalData?.details ? (originalData.details.substring(0, 50) + '...') : '-'}</span>
                  <span class="change-arrow">→</span>
                  <span class="change-new">{formData.details ? (formData.details.substring(0, 50) + '...') : '-'}</span>
                </div>
              {/if}

              {#if formData.imageUrl !== undefined && formData.imageUrl !== (originalData?.imageUrl || '')}
                <div class="change-item">
                  <span class="change-label">รูปภาพ:</span>
                  <span class="change-old">{originalData?.imageUrl ? 'มี' : 'ไม่มี'}</span>
                  <span class="change-arrow">→</span>
                  <span class="change-new">{formData.imageUrl ? 'มี' : 'ไม่มี'}</span>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        {#if formState.error}
          <div class="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>{formState.error}</span>
          </div>
        {/if}

        {#if Object.keys(formState.validationErrors).length > 0}
          <div class="alert alert-warning">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            <div>
              <p>กรุณาตรวจสอบข้อมูลต่อไปนี้:</p>
              <ul>
                {#each Object.values(formState.validationErrors) as error}
                  <li>{error}</li>
                {/each}
              </ul>
            </div>
          </div>
        {/if}

        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            on:click={handleCancel}
            disabled={formState.isSubmitting}
          >
            ยกเลิก
          </button>

          <button
            type="submit"
            class="btn btn-primary"
            disabled={!isFormValid || !hasChanges || formState.isSubmitting}
          >
            {#if formState.isSubmitting}
              <div class="spinner"></div>
              กำลังบันทึก...
            {:else}
              บันทึกการแก้ไข
            {/if}
          </button>
        </div>
      </form>
    </div>
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
    --gray-100: #f1f3f4;
    --gray-200: #e9ecef;
    --gray-300: #dee2e6;
    --border-radius: 8px;
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
  }

  /* Layout */
  .disease-edit-page {
    min-height: 100vh;
    background: var(--background);
    padding: var(--spacing-lg);
  }

  /* Header */
  .page-header {
    margin-bottom: var(--spacing-xl);
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
    font-size: 14px;
  }

  .breadcrumb-link {
    background: none;
    border: none;
    color: var(--primary);
    cursor: pointer;
    text-decoration: underline;
    font-size: inherit;
  }

  .breadcrumb-link:hover {
    color: #128a71;
  }

  .breadcrumb-separator {
    color: var(--text-secondary);
  }

  .breadcrumb-current {
    color: var(--text-primary);
    font-weight: 500;
  }

  .title-section h1 {
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }

  .title-section p {
    color: var(--text-secondary);
    font-size: 16px;
  }

  /* Loading & Error States */
  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    text-align: center;
    gap: var(--spacing-md);
    background: var(--card-bg);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    margin: 0 auto;
  }

  .error-icon {
    color: var(--danger);
  }

  .error-container h3 {
    color: var(--text-primary);
    margin: 0;
  }

  .error-container p {
    color: var(--text-secondary);
    margin: 0;
  }

  /* Form Container */
  .form-container {
    max-width: 1000px;
    margin: 0 auto;
  }

  /* Current Data Section */
  .current-data-section {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    padding: var(--spacing-xl);
    margin-bottom: var(--spacing-lg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .current-data-section h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-lg);
  }

  .current-data-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-md);
  }

  .data-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .data-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .data-value {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
  }

  .data-value.status-active {
    color: var(--success);
  }

  .data-value.status-inactive {
    color: var(--danger);
  }

  /* Form */
  .disease-form {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .form-section {
    padding: var(--spacing-xl);
    border-bottom: 1px solid var(--gray-200);
  }

  .form-section h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-lg);
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-lg);
  }

  /* Form Groups */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .form-group label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .form-group label.required::after {
    content: ' *';
    color: var(--danger);
  }

  .form-group input,
  .form-group textarea {
    padding: var(--spacing-md);
    border: 1px solid var(--gray-300);
    border-radius: var(--border-radius);
    font-size: 16px;
    min-height: 48px;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .form-group textarea {
    min-height: 120px;
    resize: vertical;
    font-family: inherit;
    line-height: 1.5;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(22, 160, 133, 0.1);
  }

  .form-group input:disabled,
  .form-group textarea:disabled {
    background: var(--gray-100);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .form-group input.error,
  .form-group textarea.error {
    border-color: var(--danger);
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
  }

  /* Input with status */
  .input-with-status {
    position: relative;
  }

  .input-status {
    position: absolute;
    right: var(--spacing-md);
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .input-status.checking {
    color: var(--text-secondary);
  }

  .input-status.available {
    color: var(--success);
  }

  .input-status.unavailable {
    color: var(--danger);
  }

  .input.checking,
  .input.available,
  .input.unavailable {
    padding-right: 48px;
  }

  /* Field meta info */
  .field-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .field-help {
    font-size: 12px;
    color: var(--text-secondary);
    flex: 1;
  }

  .char-count {
    font-size: 12px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .char-count.near-limit {
    color: var(--warning);
  }

  .char-count.over-limit {
    color: var(--danger);
  }

  .error-message {
    font-size: 12px;
    color: var(--danger);
    font-weight: 500;
  }

  /* Changes Section */
  .changes-section {
    padding: var(--spacing-lg) var(--spacing-xl);
    background: rgba(22, 160, 133, 0.05);
    border-top: 2px solid var(--primary);
  }

  .changes-section h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .changes-section h3::before {
    content: '📝';
    font-size: 20px;
  }

  .changes-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .change-item {
    display: grid;
    grid-template-columns: 120px 1fr auto 1fr;
    gap: var(--spacing-sm);
    align-items: center;
    padding: var(--spacing-sm);
    background: white;
    border-radius: var(--border-radius);
    font-size: 14px;
  }

  .change-label {
    font-weight: 500;
    color: var(--text-primary);
  }

  .change-old {
    color: var(--text-secondary);
    text-decoration: line-through;
    font-style: italic;
  }

  .change-arrow {
    color: var(--primary);
    font-weight: bold;
    text-align: center;
  }

  .change-new {
    color: var(--primary);
    font-weight: 500;
  }

  /* Alerts */
  .alert {
    display: flex;
    align-items: flex-start;
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

  .alert-warning {
    background: rgba(243, 156, 18, 0.1);
    border: 1px solid rgba(243, 156, 18, 0.2);
    color: var(--warning);
  }

  .alert ul {
    margin: var(--spacing-xs) 0 0 var(--spacing-md);
    padding: 0;
  }

  .alert li {
    font-size: 14px;
  }

  /* Form Actions */
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
    padding: var(--spacing-xl);
    background: var(--gray-100);
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-xl);
    border: none;
    border-radius: var(--border-radius);
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    min-height: 48px;
    text-decoration: none;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #128a71;
    box-shadow: 0 4px 15px rgba(22, 160, 133, 0.3);
  }

  .btn-secondary {
    background: var(--gray-200);
    color: var(--text-primary);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--gray-300);
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

  .input-status .spinner {
    border-color: var(--text-secondary);
    border-top-color: var(--primary);
  }

  .loading-container .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--gray-200);
    border-top: 3px solid var(--primary);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .disease-edit-page {
      padding: var(--spacing-md);
    }

    .current-data-grid {
      grid-template-columns: 1fr;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column-reverse;
    }

    .field-meta {
      flex-direction: column;
      align-items: flex-start;
    }

    .change-item {
      grid-template-columns: 1fr;
      gap: var(--spacing-xs);
      text-align: left;
    }

    .change-arrow {
      display: none;
    }
  }

  @media (max-width: 640px) {
    .title-section h1 {
      font-size: 24px;
    }

    .form-section,
    .current-data-section {
      padding: var(--spacing-lg);
    }

    .form-actions {
      padding: var(--spacing-lg);
    }

    .breadcrumb {
      flex-wrap: wrap;
    }

    .changes-section {
      padding: var(--spacing-lg);
    }
  }
</style>