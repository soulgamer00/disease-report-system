<!-- frontend/src/routes/patients/components/PatientImportExport.svelte -->
<!-- frontend/src/routes/patients/components/PatientImportExport.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { patientApi, downloadFile } from '$lib/api/patients/client';
  import { patientStore } from '$lib/stores/patientStore';
  import type { ImportResult } from '$lib/api/patients/client';

  export let canImportData: boolean; // ✅ เพิ่ม prop สำหรับ role check

  const dispatch = createEventDispatcher<{
    importSuccess: ImportResult;
    exportSuccess: string;
  }>();

  // Component state
  let showImportModal = false;
  let showExportModal = false;
  let importing = false;
  let exporting = false;
  let selectedFile: File | null = null;
  let importResult: ImportResult | null = null;
  let exportFormat: 'csv' | 'excel' = 'excel';

  // Get current filters for export
  $: currentFilters = $patientStore.filters;

  // File input element
  let fileInput: HTMLInputElement;

  // Handle file selection
  function handleFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    
    if (files && files.length > 0) {
      selectedFile = files[0];
      
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'application/csv'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        alert('กรุณาเลือกไฟล์ Excel (.xlsx, .xls) หรือ CSV เท่านั้น');
        selectedFile = null;
        return;
      }
      
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)');
        selectedFile = null;
        return;
      }
    }
  }

  // Download template
  async function downloadTemplate(): Promise<void> {
    try {
      exporting = true;
      const blob = await patientApi.downloadTemplate(exportFormat);
      const filename = `patient-template.${exportFormat === 'excel' ? 'xlsx' : 'csv'}`;
      downloadFile(blob, filename);
    } catch (error) {
      console.error('Download template error:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด Template');
    } finally {
      exporting = false;
    }
  }

  // Import patients
  async function importPatients(): Promise<void> {
    if (!selectedFile) {
      alert('กรุณาเลือกไฟล์ที่จะ Import');
      return;
    }

    importing = true;
    importResult = null;

    try {
      const response = await patientApi.importPatients(selectedFile);
      
      if (response.success && response.data) {
        importResult = response.data;
        dispatch('importSuccess', response.data);
        
        // Show success message
        const { summary } = response.data;
        alert(`Import สำเร็จ!\nสำเร็จ: ${summary.successfulRows} รายการ\nล้มเหลว: ${summary.failedRows} รายการ`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(`เกิดข้อผิดพลาดในการ Import: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      importing = false;
    }
  }

  // Export patients
  async function exportPatients(): Promise<void> {
    exporting = true;

    try {
      const blob = await patientApi.exportPatients({
        format: exportFormat,
        filters: currentFilters
      });
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `patients-export-${timestamp}.${exportFormat === 'excel' ? 'xlsx' : 'csv'}`;
      
      downloadFile(blob, filename);
      dispatch('exportSuccess', filename);
      
      closeExportModal();
    } catch (error) {
      console.error('Export error:', error);
      alert(`เกิดข้อผิดพลาดในการ Export: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      exporting = false;
    }
  }

  // Modal handlers
  function openImportModal(): void {
    showImportModal = true;
    selectedFile = null;
    importResult = null;
  }

  function closeImportModal(): void {
    showImportModal = false;
    selectedFile = null;
    importResult = null;
  }

  function openExportModal(): void {
    showExportModal = true;
  }

  function closeExportModal(): void {
    showExportModal = false;
  }

  // Reset file input
  function resetFileInput(): void {
    if (fileInput) {
      fileInput.value = '';
    }
    selectedFile = null;
  }
</script>

<div class="import-export-container">
  <!-- Action Buttons -->
  <div class="action-buttons">
    <!-- ✅ เฉพาะ ADMIN/SUPERUSER Import ได้ -->
    {#if canImportData}
      <button 
        type="button" 
        class="btn-import"
        on:click={openImportModal}
        disabled={importing}
      >
        📥 Import ข้อมูล
      </button>
    {/if}
    
    <!-- ✅ ทุกคน Export ได้ -->
    <button 
      type="button" 
      class="btn-export"
      on:click={openExportModal}
      disabled={exporting}
    >
      📤 Export ข้อมูล
    </button>
  </div>

  <!-- Import Modal - เฉพาะ ADMIN/SUPERUSER -->
  {#if canImportData && showImportModal}
    <div class="modal-overlay" on:click={closeImportModal}>
      <div class="modal-content" on:click|stopPropagation>
        <div class="modal-header">
          <h3>📥 Import ข้อมูลผู้ป่วย</h3>
          <button type="button" class="close-btn" on:click={closeImportModal}>×</button>
        </div>

        <div class="modal-body">
          <!-- Step 1: Download Template -->
          <div class="import-step">
            <h4>ขั้นตอนที่ 1: ดาวน์โหลด Template</h4>
            <p>ดาวน์โหลดไฟล์ Template เพื่อใช้เป็นแม่แบบในการเตรียมข้อมูล</p>
            
            <div class="template-section">
              <div class="format-selector">
                <label>
                  <input type="radio" bind:group={exportFormat} value="excel" />
                  Excel (.xlsx)
                </label>
                <label>
                  <input type="radio" bind:group={exportFormat} value="csv" />
                  CSV (.csv)
                </label>
              </div>
              
              <button 
                type="button" 
                class="btn-download"
                on:click={downloadTemplate}
                disabled={exporting}
              >
                {#if exporting}
                  กำลังดาวน์โหลด...
                {:else}
                  📄 ดาวน์โหลด Template
                {/if}
              </button>
            </div>
          </div>

          <!-- Step 2: Upload File -->
          <div class="import-step">
            <h4>ขั้นตอนที่ 2: เลือกไฟล์ที่จะ Import</h4>
            <p>เลือกไฟล์ Excel หรือ CSV ที่เตรียมข้อมูลแล้ว</p>
            
            <div class="file-upload">
              <input
                bind:this={fileInput}
                type="file"
                accept=".xlsx,.xls,.csv"
                on:change={handleFileSelect}
                style="display: none;"
              />
              
              <button 
                type="button" 
                class="file-select-btn"
                on:click={() => fileInput.click()}
              >
                📁 เลือกไฟล์
              </button>
              
              {#if selectedFile}
                <div class="selected-file">
                  <span class="file-info">
                    📄 {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </span>
                  <button type="button" class="remove-file" on:click={resetFileInput}>×</button>
                </div>
              {/if}
            </div>
          </div>

          <!-- Step 3: Import -->
          <div class="import-step">
            <h4>ขั้นตอนที่ 3: Import ข้อมูล</h4>
            
            <button 
              type="button" 
              class="btn-import-action"
              on:click={importPatients}
              disabled={!selectedFile || importing}
            >
              {#if importing}
                กำลัง Import...
              {:else}
                🚀 เริ่ม Import
              {/if}
            </button>
          </div>

          <!-- Import Results -->
          {#if importResult}
            <div class="import-results">
              <h4>ผลการ Import</h4>
              
              <div class="result-summary">
                <div class="result-stat success">
                  ✅ สำเร็จ: {importResult.summary.successfulRows} รายการ
                </div>
                <div class="result-stat error">
                  ❌ ล้มเหลว: {importResult.summary.failedRows} รายการ
                </div>
                <div class="result-stat total">
                  📊 รวม: {importResult.summary.totalRows} รายการ
                </div>
              </div>

              {#if importResult.failed.length > 0}
                <div class="failed-records">
                  <h5>รายการที่ล้มเหลว:</h5>
                  <div class="failed-list">
                    {#each importResult.failed.slice(0, 5) as failed}
                      <div class="failed-item">
                        <strong>แถว {failed.rowNumber}:</strong>
                        {failed.errors.join(', ')}
                      </div>
                    {/each}
                    {#if importResult.failed.length > 5}
                      <div class="more-errors">
                        และอีก {importResult.failed.length - 5} รายการ...
                      </div>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-close" on:click={closeImportModal}>
            ปิด
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Export Modal - ทุกคนใช้ได้ -->
  {#if showExportModal}
    <div class="modal-overlay" on:click={closeExportModal}>
      <div class="modal-content" on:click|stopPropagation>
        <div class="modal-header">
          <h3>📤 Export ข้อมูลผู้ป่วย</h3>
          <button type="button" class="close-btn" on:click={closeExportModal}>×</button>
        </div>

        <div class="modal-body">
          <div class="export-options">
            <h4>เลือกรูปแบบไฟล์</h4>
            <div class="format-selector">
              <label>
                <input type="radio" bind:group={exportFormat} value="excel" />
                Excel (.xlsx) - แนะนำ
              </label>
              <label>
                <input type="radio" bind:group={exportFormat} value="csv" />
                CSV (.csv) - ใช้กับโปรแกรมอื่น
              </label>
            </div>
          </div>

          <div class="export-info">
            <h4>ข้อมูลที่จะ Export</h4>
            <ul>
              <li>จะ Export ข้อมูลตามตัวกรองปัจจุบัน</li>
              <li>รวมข้อมูลส่วนตัว ที่อยู่ การเจ็บป่วย ผลตรวจ</li>
              <li>ไฟล์จะมีรูปแบบเดียวกับ Template</li>
            </ul>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-close" on:click={closeExportModal}>
            ยกเลิก
          </button>
          <button 
            type="button" 
            class="btn-export-action"
            on:click={exportPatients}
            disabled={exporting}
          >
            {#if exporting}
              กำลัง Export...
            {:else}
              📤 Export ตอนนี้
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .action-buttons {
    display: flex;
    gap: 8px;
  }

  .btn-import,
  .btn-export {
    background: #6c757d;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .btn-import:hover { background: #5a6268; }
  .btn-export:hover { background: #5a6268; }

  .btn-import:disabled,
  .btn-export:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e9ecef;
  }

  .modal-header h3 {
    margin: 0;
    color: #2c3e50;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #6c757d;
  }

  .close-btn:hover {
    color: #e74c3c;
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .import-step {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e9ecef;
  }

  .import-step:last-child {
    border-bottom: none;
  }

  .import-step h4 {
    margin: 0 0 8px 0;
    color: #2c3e50;
  }

  .import-step p {
    margin: 0 0 12px 0;
    color: #6c757d;
    font-size: 14px;
  }

  .template-section,
  .export-options {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .format-selector {
    display: flex;
    gap: 16px;
  }

  .format-selector label {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
  }

  .btn-download,
  .btn-import-action,
  .btn-export-action {
    background: #16a085;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }

  .btn-download:hover,
  .btn-import-action:hover,
  .btn-export-action:hover {
    background: #138d75;
  }

  .btn-download:disabled,
  .btn-import-action:disabled,
  .btn-export-action:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .file-upload {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .file-select-btn {
    background: #495057;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    align-self: flex-start;
  }

  .file-select-btn:hover {
    background: #343a40;
  }

  .selected-file {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 4px;
  }

  .file-info {
    flex: 1;
    font-size: 14px;
  }

  .remove-file {
    background: #e74c3c;
    color: white;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    cursor: pointer;
    font-size: 12px;
  }

  .import-results {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 16px;
    margin-top: 16px;
  }

  .import-results h4 {
    margin: 0 0 12px 0;
    color: #2c3e50;
  }

  .result-summary {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .result-stat {
    padding: 8px 12px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 14px;
  }

  .result-stat.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .result-stat.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .result-stat.total {
    background: #e2e3e5;
    color: #383d41;
    border: 1px solid #d6d8db;
  }

  .failed-records {
    margin-top: 16px;
  }

  .failed-records h5 {
    margin: 0 0 8px 0;
    color: #721c24;
  }

  .failed-list {
    max-height: 150px;
    overflow-y: auto;
  }

  .failed-item {
    padding: 6px 8px;
    background: white;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    margin-bottom: 4px;
    font-size: 13px;
  }

  .more-errors {
    text-align: center;
    color: #6c757d;
    font-style: italic;
    margin-top: 8px;
  }

  .export-info ul {
    margin: 8px 0;
    padding-left: 20px;
  }

  .export-info li {
    margin-bottom: 4px;
    color: #6c757d;
    font-size: 14px;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px 20px;
    border-top: 1px solid #e9ecef;
    background: #f8f9fa;
  }

  .btn-close {
    background: #6c757d;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }

  .btn-close:hover {
    background: #5a6268;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .modal-content {
      width: 95%;
      max-height: 90vh;
    }

    .template-section,
    .export-options {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .result-summary {
      flex-direction: column;
      gap: 8px;
    }

    .modal-footer {
      flex-direction: column;
    }
  }
</style>