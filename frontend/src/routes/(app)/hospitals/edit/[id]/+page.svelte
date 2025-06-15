<!-- src/routes/(app)/hospitals/edit/[id]/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { 
    hospitalState,
    hospitalFormState,
    loadHospitalById,
    updateHospital,
    checkHospitalCodeAvailability,
    resetHospitalFormState,
    clearCurrentHospital 
  } from '$lib/stores/hospitals';
  import { userRole } from '$lib/stores/auth';
  import type { UpdateHospitalData } from '$lib/api/types';

  // ===== Route Parameters =====
  $: hospitalId = parseInt($page.params.id);

  // ===== Form Data =====
  let formData: UpdateHospitalData = {
    hospitalCode5Digit: '',
    hospitalName: '',
    hospitalCode9eDigit: '',
    hospitalCode9Digit: '',
    organizationType: '',
    healthServiceType: '',
    affiliation: '',
    departmentDivision: '',
  };

  let originalData: UpdateHospitalData = {};
  let formErrors: Record<string, string> = {};
  let touchedFields: Record<string, boolean> = {};

  // ===== Reactive State =====
  $: hospital = $hospitalState.currentHospital;
  $: isLoading = $hospitalState.isLoading || $hospitalFormState.isLoading;
  $: error = $hospitalState.error;
  $: formError = $hospitalFormState.error;
  $: isCodeAvailable = $hospitalFormState.isCodeAvailable;
  $: isCheckingCode = $hospitalFormState.isCheckingCode;
  $: role = $userRole;

  // Auto-check code availability (only if code changed)
  let codeCheckTimeout: number;
  $: if (formData.hospitalCode5Digit && 
         formData.hospitalCode5Digit.length === 5 &&
         formData.hospitalCode5Digit !== originalData.hospitalCode5Digit) {
    clearTimeout(codeCheckTimeout);
    codeCheckTimeout = setTimeout(() => {
      if (!formErrors.hospitalCode5Digit) {
        checkHospitalCodeAvailability(formData.hospitalCode5Digit, hospitalId);
      }
    }, 300);
  }

  // Check if form has changes
  $: hasChanges = Object.keys(formData).some(key => {
    const current = formData[key as keyof UpdateHospitalData] || '';
    const original = originalData[key as keyof UpdateHospitalData] || '';
    return current !== original;
  });

  // ===== Lifecycle =====
  onMount(async () => {
    console.log('DEBUG (hospitals/edit): Component mounted, hospitalId:', hospitalId);
    
    // Check permissions
    if (!role.isSuperuser) {
      console.log('DEBUG (hospitals/edit): Insufficient permissions, redirecting');
      goto('/hospitals');
      return;
    }

    // Validate ID
    if (isNaN(hospitalId) || hospitalId <= 0) {
      console.log('DEBUG (hospitals/edit): Invalid hospital ID, redirecting');
      goto('/hospitals');
      return;
    }

    resetHospitalFormState();
    
    // Load hospital data
    const loadedHospital = await loadHospitalById(hospitalId);
    if (loadedHospital) {
      populateForm(loadedHospital);
    } else {
      console.log('DEBUG (hospitals/edit): Hospital not found, redirecting');
      goto('/hospitals');
    }
  });

  // ===== Populate Form =====
  function populateForm(hospitalData: any) {
    console.log('DEBUG (hospitals/edit): Populating form with data:', hospitalData.hospitalName);
    
    formData = {
      hospitalCode5Digit: hospitalData.hospitalCode5Digit || '',
      hospitalName: hospitalData.hospitalName || '',
      hospitalCode9eDigit: hospitalData.hospitalCode9eDigit || '',
      hospitalCode9Digit: hospitalData.hospitalCode9Digit || '',
      organizationType: hospitalData.organizationType || '',
      healthServiceType: hospitalData.healthServiceType || '',
      affiliation: hospitalData.affiliation || '',
      departmentDivision: hospitalData.departmentDivision || '',
    };
    
    // Store original data for comparison
    originalData = { ...formData };
  }

  // ===== Validation =====
  function validateField(field: string, value: string): string | null {
    switch (field) {
      case 'hospitalCode5Digit':
        if (!value) return 'รหัสโรงพยาบาล 5 หลักจำเป็นต้องระบุ';
        if (value.length !== 5) return 'รหัสโรงพยาบาลต้องมี 5 หลักเท่านั้น';
        if (!/^[A-Z0-9]{5}$/.test(value)) return 'รหัสโรงพยาบาลต้องเป็นตัวอักษรพิมพ์ใหญ่และตัวเลขเท่านั้น';
        // Only check availability if code changed
        if (value !== originalData.hospitalCode5Digit && isCodeAvailable === false) {
          return 'รหัสโรงพยาบาลนี้มีอยู่แล้วในระบบ';
        }
        return null;

      case 'hospitalName':
        if (value && value.length < 2) return 'ชื่อโรงพยาบาลต้องมีอย่างน้อย 2 ตัวอักษร';
        if (value && value.length > 255) return 'ชื่อโรงพยาบาลต้องไม่เกิน 255 ตัวอักษร';
        if (value && !/^[\u0E00-\u0E7Fa-zA-Z0-9\s\-\(\)\.\,\/]+$/.test(value)) {
          return 'ชื่อโรงพยาบาลมีตัวอักษรที่ไม่อนุญาต';
        }
        return null;

      case 'hospitalCode9eDigit':
        if (value && value.length !== 9) return 'รหัส 9E ต้องมี 9 หลักเท่านั้น';
        if (value && !/^[A-Z0-9]{9}$/.test(value)) return 'รหัส 9E ต้องเป็นตัวอักษรพิมพ์ใหญ่และตัวเลขเท่านั้น';
        return null;

      case 'hospitalCode9Digit':
        if (value && value.length !== 9) return 'รหัส 9 หลักต้องมี 9 หลักเท่านั้น';
        if (value && !/^[A-Z0-9]{9}$/.test(value)) return 'รหัส 9 หลักต้องเป็นตัวอักษรพิมพ์ใหญ่และตัวเลขเท่านั้น';
        return null;

      case 'organizationType':
      case 'healthServiceType':
      case 'affiliation':
      case 'departmentDivision':
        if (value && value.length > 255) return 'ข้อมูลต้องไม่เกิน 255 ตัวอักษร';
        return null;

      default:
        return null;
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Validate all fields
    Object.keys(formData).forEach(field => {
      const value = formData[field as keyof UpdateHospitalData] || '';
      const error = validateField(field, value);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    });

    // Check code availability (only if code changed)
    if (formData.hospitalCode5Digit !== originalData.hospitalCode5Digit && isCodeAvailable === false) {
      errors.hospitalCode5Digit = 'รหัสโรงพยาบาลนี้มีอยู่แล้วในระบบ';
      isValid = false;
    }

    if (isCheckingCode) {
      errors.hospitalCode5Digit = 'กำลังตรวจสอบรหัสโรงพยาบาล...';
      isValid = false;
    }

    formErrors = errors;
    return isValid;
  }

  // ===== Event Handlers =====
  function handleFieldChange(field: string, value: string) {
    formData[field as keyof UpdateHospitalData] = value;
    touchedFields[field] = true;

    // Auto-capitalize codes
    if (field === 'hospitalCode5Digit' || field === 'hospitalCode9eDigit' || field === 'hospitalCode9Digit') {
      formData[field as keyof UpdateHospitalData] = value.toUpperCase();
    }

    // Validate field
    const error = validateField(field, value);
    if (error) {
      formErrors[field] = error;
    } else {
      delete formErrors[field];
    }
    formErrors = { ...formErrors };
  }

  function handleFieldBlur(field: string) {
    touchedFields[field] = true;
    const value = formData[field as keyof UpdateHospitalData] || '';
    const error = validateField(field, value);
    
    if (error) {
      formErrors[field] = error;
    } else {
      delete formErrors[field];
    }
    formErrors = { ...formErrors };
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    if (!hasChanges) {
      console.log('DEBUG (hospitals/edit): No changes detected');
      goto('/hospitals');
      return;
    }

    // Mark all fields as touched
    Object.keys(formData).forEach(field => {
      touchedFields[field] = true;
    });

    if (!validateForm()) {
      console.log('DEBUG (hospitals/edit): Form validation failed');
      return;
    }

    console.log('DEBUG (hospitals/edit): Submitting hospital update');
    
    // Only send changed fields
    const changes: UpdateHospitalData = {};
    Object.keys(formData).forEach(key => {
      const current = formData[key as keyof UpdateHospitalData] || '';
      const original = originalData[key as keyof UpdateHospitalData] || '';
      if (current !== original) {
        changes[key as keyof UpdateHospitalData] = current.trim() || undefined;
      }
    });

    // Remove empty strings
    Object.keys(changes).forEach(key => {
      if (changes[key as keyof UpdateHospitalData] === '') {
        delete changes[key as keyof UpdateHospitalData];
      }
    });

    const success = await updateHospital(hospitalId, changes);
    
    if (success) {
      console.log('DEBUG (hospitals/edit): Hospital updated successfully');
      goto('/hospitals');
    }
  }

  function handleCancel() {
    goto('/hospitals');
  }

  function handleReset() {
    if (hospital) {
      populateForm(hospital);
      formErrors = {};
      touchedFields = {};
    }
  }

  // ===== Utility Functions =====
  function getFieldError(field: string): string | null {
    return touchedFields[field] ? formErrors[field] || null : null;
  }

  function isFieldValid(field: string): boolean {
    return touchedFields[field] && !formErrors[field];
  }

  function isCodeChanged(): boolean {
    return formData.hospitalCode5Digit !== originalData.hospitalCode5Digit;
  }
</script>

<svelte:head>
  <title>แก้ไขโรงพยาบาล - ระบบเฝ้าระวังโรคติดต่อโดยแมลง</title>
</svelte:head>

<div class="hospital-edit">
  <!-- Loading State -->
  {#if isLoading && !hospital}
    <div class="loading-container">
      <div class="spinner"></div>
      <p>กำลังโหลดข้อมูลโรงพยาบาล...</p>
    </div>
  {:else if error && !hospital}
    <!-- Error State -->
    <div class="error-container">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <h2>ไม่พบข้อมูลโรงพยาบาล</h2>
      <p>{error}</p>
      <button class="btn btn-primary" on:click={() => goto('/hospitals')}>
        กลับไปรายการโรงพยาบาล
      </button>
    </div>
  {:else if hospital}
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <button class="btn-back" on:click={handleCancel}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
            กลับ
          </button>
          <div class="title-content">
            <h1>แก้ไขโรงพยาบาล</h1>
            <p>{hospital.hospitalName || 'โรงพยาบาลไม่ระบุชื่อ'} (รหัส: {hospital.hospitalCode5Digit})</p>
          </div>
        </div>
        
        <!-- Changes Indicator -->
        {#if hasChanges}
          <div class="changes-indicator">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
            </svg>
            มีการเปลี่ยนแปลง
          </div>
        {/if}
      </div>
    </div>

    <!-- Form Container -->
    <div class="form-container">
      <form on:submit={handleSubmit} class="hospital-form">
        <!-- Required Information Card -->
        <div class="form-card">
          <div class="card-header">
            <h2>ข้อมูลจำเป็น</h2>
            <span class="required-info">* ข้อมูลที่จำเป็นต้องกรอก</span>
          </div>
          
          <div class="card-body">
            <div class="form-grid">
              <!-- Hospital Code 5 Digit (Required) -->
              <div class="form-group span-1">
                <label for="hospitalCode5Digit">
                  รหัสโรงพยาบาล (9 หลัก) <span class="required">*</span>
                </label>
                <div class="input-wrapper">
                  <input
                    id="hospitalCode5Digit"
                    type="text"
                    maxlength="9"
                    placeholder="เช่น A1234"
                    value={formData.hospitalCode5Digit}
                    on:input={(e) => handleFieldChange('hospitalCode5Digit', e.currentTarget.value)}
                    on:blur={() => handleFieldBlur('hospitalCode5Digit')}
                    disabled={isLoading}
                    class:error={getFieldError('hospitalCode5Digit')}
                    class:success={isFieldValid('hospitalCode5Digit') && (!isCodeChanged() || isCodeAvailable === true)}
                    class:checking={isCheckingCode && isCodeChanged()}
                  />
                  
                  <!-- Code validation status -->
                  {#if isCheckingCode && isCodeChanged()}
                    <div class="input-status checking">
                      <div class="spinner small"></div>
                    </div>
                  {:else if isCodeChanged() && formData.hospitalCode5Digit.length === 5 && isCodeAvailable === true}
                    <div class="input-status success">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    </div>
                  {:else if isCodeChanged() && formData.hospitalCode5Digit.length === 5 && isCodeAvailable === false}
                    <div class="input-status error">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </div>
                  {:else if !isCodeChanged() && formData.hospitalCode5Digit.length === 5}
                    <div class="input-status unchanged">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 11H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h4M15 11h4a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-4M12 11V7a4 4 0 1 0-8 0v4"/>
                      </svg>
                    </div>
                  {/if}
                </div>
                
                {#if getFieldError('hospitalCode5Digit')}
                  <span class="error-message">{getFieldError('hospitalCode5Digit')}</span>
                {:else if isCodeChanged() && isCodeAvailable === true && formData.hospitalCode5Digit.length === 5}
                  <span class="success-message">รหัสโรงพยาบาลใหม่พร้อมใช้งาน</span>
                {:else if !isCodeChanged() && formData.hospitalCode5Digit.length === 5}
                  <span class="info-message">รหัสเดิม (ไม่มีการเปลี่ยนแปลง)</span>
                {/if}
                <small class="field-hint">รหัสโรงพยาบาล 5 หลัก ประกอบด้วยตัวอักษรพิมพ์ใหญ่และตัวเลข</small>
              </div>

              <!-- Hospital Name -->
              <div class="form-group span-2">
                <label for="hospitalName">ชื่อโรงพยาบาล</label>
                <input
                  id="hospitalName"
                  type="text"
                  placeholder="เช่น โรงพยาบาลพิษณุโลก"
                  value={formData.hospitalName}
                  on:input={(e) => handleFieldChange('hospitalName', e.currentTarget.value)}
                  on:blur={() => handleFieldBlur('hospitalName')}
                  disabled={isLoading}
                  class:error={getFieldError('hospitalName')}
                  class:success={isFieldValid('hospitalName')}
                />
                {#if getFieldError('hospitalName')}
                  <span class="error-message">{getFieldError('hospitalName')}</span>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- Optional Information Card -->
        <div class="form-card">
          <div class="card-header">
            <h2>ข้อมูลเพิ่มเติม</h2>
            <span class="optional-info">ข้อมูลเสริมสำหรับการจัดการ</span>
          </div>
          
          <div class="card-body">
            <div class="form-grid">
              <!-- 9E Code -->
              <div class="form-group">
                <label for="hospitalCode9eDigit">รหัส 9E หลัก</label>
                <input
                  id="hospitalCode9eDigit"
                  type="text"
                  maxlength="9"
                  placeholder="เช่น A12345678"
                  value={formData.hospitalCode9eDigit}
                  on:input={(e) => handleFieldChange('hospitalCode9eDigit', e.currentTarget.value)}
                  on:blur={() => handleFieldBlur('hospitalCode9eDigit')}
                  disabled={isLoading}
                  class:error={getFieldError('hospitalCode9eDigit')}
                  class:success={isFieldValid('hospitalCode9eDigit')}
                />
                {#if getFieldError('hospitalCode9eDigit')}
                  <span class="error-message">{getFieldError('hospitalCode9eDigit')}</span>
                {/if}
              </div>

              <!-- 9 Digit Code -->
              <div class="form-group">
                <label for="hospitalCode9Digit">รหัส 9 หลัก</label>
                <input
                  id="hospitalCode9Digit"
                  type="text"
                  maxlength="9"
                  placeholder="เช่น 123456789"
                  value={formData.hospitalCode9Digit}
                  on:input={(e) => handleFieldChange('hospitalCode9Digit', e.currentTarget.value)}
                  on:blur={() => handleFieldBlur('hospitalCode9Digit')}
                  disabled={isLoading}
                  class:error={getFieldError('hospitalCode9Digit')}
                  class:success={isFieldValid('hospitalCode9Digit')}
                />
                {#if getFieldError('hospitalCode9Digit')}
                  <span class="error-message">{getFieldError('hospitalCode9Digit')}</span>
                {/if}
              </div>

              <!-- Organization Type -->
              <div class="form-group">
                <label for="organizationType">ประเภทองค์กร</label>
                <select
                  id="organizationType"
                  value={formData.organizationType}
                  on:change={(e) => handleFieldChange('organizationType', e.currentTarget.value)}
                  on:blur={() => handleFieldBlur('organizationType')}
                  disabled={isLoading}
                  class:error={getFieldError('organizationType')}
                  class:success={isFieldValid('organizationType')}
                >
                  <option value="">เลือกประเภทองค์กร</option>
                  <option value="โรงพยาบาลศูนย์">โรงพยาบาลศูนย์</option>
                  <option value="โรงพยาบาลทั่วไป">โรงพยาบาลทั่วไป</option>
                  <option value="โรงพยาบาลชุมชน">โรงพยาบาลชุมชน</option>
                  <option value="โรงพยาบาลส่งเสริมสุขภาพตำบล">โรงพยาบาลส่งเสริมสุขภาพตำบล</option>
                  <option value="สถานีอนามัย">สถานีอนามัย</option>
                  <option value="คลินิก">คลินิก</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
                {#if getFieldError('organizationType')}
                  <span class="error-message">{getFieldError('organizationType')}</span>
                {/if}
              </div>

              <!-- Health Service Type -->
              <div class="form-group">
                <label for="healthServiceType">ประเภทบริการสุขภาพ</label>
                <select
                  id="healthServiceType"
                  value={formData.healthServiceType}
                  on:change={(e) => handleFieldChange('healthServiceType', e.currentTarget.value)}
                  on:blur={() => handleFieldBlur('healthServiceType')}
                  disabled={isLoading}
                  class:error={getFieldError('healthServiceType')}
                  class:success={isFieldValid('healthServiceType')}
                >
                  <option value="">เลือกประเภทบริการ</option>
                  <option value="บริการปฐมภูมิ">บริการปฐมภูมิ</option>
                  <option value="บริการทุติยภูมิ">บริการทุติยภูมิ</option>
                  <option value="บริการตติยภูมิ">บริการตติยภูมิ</option>
                  <option value="บริการเฉพาะทาง">บริการเฉพาะทาง</option>
                  <option value="บริการฉุกเฉิน">บริการฉุกเฉิน</option>
                  <option value="บริการส่งเสริมป้องกัน">บริการส่งเสริมป้องกัน</option>
                </select>
                {#if getFieldError('healthServiceType')}
                  <span class="error-message">{getFieldError('healthServiceType')}</span>
                {/if}
              </div>

              <!-- Affiliation -->
              <div class="form-group span-2">
                <label for="affiliation">สังกัด/หน่วยงานต้นสังกัด</label>
                <input
                  id="affiliation"
                  type="text"
                  placeholder="เช่น กระทรวงสาธารณสุข, เทศบาล, องค์การบริหารส่วนตำบล"
                  value={formData.affiliation}
                  on:input={(e) => handleFieldChange('affiliation', e.currentTarget.value)}
                  on:blur={() => handleFieldBlur('affiliation')}
                  disabled={isLoading}
                  class:error={getFieldError('affiliation')}
                  class:success={isFieldValid('affiliation')}
                />
                {#if getFieldError('affiliation')}
                  <span class="error-message">{getFieldError('affiliation')}</span>
                {/if}
              </div>

              <!-- Department Division -->
              <div class="form-group span-2">
                <label for="departmentDivision">แผนก/หน่วยงาน</label>
                <input
                  id="departmentDivision"
                  type="text"
                  placeholder="เช่น แผนกอายุรกรรม, หน่วยเวชกรรมฉุกเฉิน"
                  value={formData.departmentDivision}
                  on:input={(e) => handleFieldChange('departmentDivision', e.currentTarget.value)}
                  on:blur={() => handleFieldBlur('departmentDivision')}
                  disabled={isLoading}
                  class:error={getFieldError('departmentDivision')}
                  class:success={isFieldValid('departmentDivision')}
                />
                {#if getFieldError('departmentDivision')}
                  <span class="error-message">{getFieldError('departmentDivision')}</span>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- Form Error -->
        {#if formError}
          <div class="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {formError}
          </div>
        {/if}

        <!-- Form Actions -->
        <div class="form-actions">
          <div class="action-group">
            <button
              type="button"
              class="btn btn-secondary"
              on:click={handleCancel}
              disabled={isLoading}
            >
              ยกเลิก
            </button>
            
            {#if hasChanges}
              <button
                type="button"
                class="btn btn-warning"
                on:click={handleReset}
                disabled={isLoading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="23,4 23,10 17,10"/>
                  <path d="M20.49,15a9,9,0,1,1-2.12-9.36L23,10"/>
                </svg>
                คืนค่าเดิม
              </button>
            {/if}
          </div>
          
          <button
            type="submit"
            class="btn btn-primary"
            disabled={isLoading || isCheckingCode || Object.keys(formErrors).length > 0 || !hasChanges}
          >
            {#if isLoading}
              <div class="spinner small"></div>
              กำลังบันทึก...
            {:else}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
              บันทึกการเปลี่ยนแปลง
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>

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
  }

  /* Layout */
  .hospital-edit {
    min-height: 100vh;
    background: var(--background);
    padding: 24px;
    max-width: 1000px;
    margin: 0 auto;
  }

  /* Loading/Error States */
  .loading-container, .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    color: var(--text-secondary);
    text-align: center;
  }

  .loading-container .spinner {
    margin-bottom: 16px;
  }

  .error-container svg {
    color: var(--danger);
    margin-bottom: 16px;
  }

  .error-container h2 {
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .error-container p {
    margin-bottom: 24px;
  }

  /* Header */
  .page-header {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .btn-back {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--gray-200);
    border: none;
    border-radius: 8px;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 14px;
    transition: background 0.15s ease;
    min-height: 44px;
  }

  .btn-back:hover {
    background: var(--gray-300);
  }

  .title-content h1 {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .title-content p {
    color: var(--text-secondary);
    font-size: 14px;
  }

  .changes-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(243, 156, 18, 0.1);
    color: var(--warning);
    border-radius: 16px;
    font-size: 12px;
    font-weight: 500;
  }

  /* Form Container */
  .form-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .hospital-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* Form Cards */
  .form-card {
    background: var(--card-bg);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .card-header {
    background: var(--gray-100);
    padding: 20px 24px;
    border-bottom: 1px solid var(--gray-200);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-header h2 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .required-info {
    font-size: 12px;
    color: var(--danger);
    font-weight: 500;
  }

  .optional-info {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .card-body {
    padding: 24px;
  }

  /* Form Grid */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group.span-1 {
    grid-column: span 1;
  }

  .form-group.span-2 {
    grid-column: span 2;
  }

  /* Form Elements */
  label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .required {
    color: var(--danger);
    font-weight: 600;
  }

  .input-wrapper {
    position: relative;
  }

  input, select {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--gray-300);
    border-radius: 8px;
    font-size: 16px;
    background: var(--card-bg);
    min-height: 44px;
    box-sizing: border-box;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  input:focus, select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(22, 160, 133, 0.1);
  }

  input:disabled, select:disabled {
    background: var(--gray-100);
    cursor: not-allowed;
    opacity: 0.6;
  }

  input.error, select.error {
    border-color: var(--danger);
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
  }

  input.success, select.success {
    border-color: var(--success);
    box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.1);
  }

  input.checking {
    border-color: var(--info);
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  /* Input Status Icons */
  .input-status {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .input-status.success {
    color: var(--success);
  }

  .input-status.error {
    color: var(--danger);
  }

  .input-status.checking {
    color: var(--info);
  }

  .input-status.unchanged {
    color: var(--text-secondary);
  }

  /* Field Messages */
  .error-message {
    font-size: 12px;
    color: var(--danger);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .success-message {
    font-size: 12px;
    color: var(--success);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .info-message {
    font-size: 12px;
    color: var(--info);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .field-hint {
    font-size: 12px;
    color: var(--text-secondary);
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    min-height: 44px;
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

  .btn-warning {
    background: var(--warning);
    color: white;
  }

  .btn-warning:hover:not(:disabled) {
    background: #e67e22;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Form Actions */
  .form-actions {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .action-group {
    display: flex;
    gap: 12px;
  }

  /* Alert */
  .alert {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-radius: 8px;
    font-size: 14px;
  }

  .alert-error {
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.2);
    color: var(--danger);
  }

  /* Spinner */
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--gray-200);
    border-top: 3px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .spinner.small {
    width: 16px;
    height: 16px;
    border-width: 2px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .hospital-edit {
      padding: 16px;
    }

    .page-header {
      padding: 16px;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .form-group.span-1,
    .form-group.span-2 {
      grid-column: span 1;
    }

    .card-body {
      padding: 16px;
    }

    .form-actions {
      padding: 16px;
      flex-direction: column;
      gap: 16px;
    }

    .action-group {
      width: 100%;
      justify-content: space-between;
    }

    .card-header {
      padding: 16px;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }

  @media (max-width: 640px) {
    .title-content h1 {
      font-size: 20px;
    }

    .btn-back {
      padding: 8px 12px;
      font-size: 12px;
    }

    input, select {
      font-size: 16px; /* Prevent zoom on iOS */
    }

    .action-group {
      flex-direction: column;
      gap: 8px;
    }
  }
</style>