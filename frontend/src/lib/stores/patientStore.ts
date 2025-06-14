// frontend/src/lib/stores/patientStore.ts
// ✅ Patient Store - State Management

import { writable, derived, get } from 'svelte/store';
import { patientApi, type Patient, type CreatePatientData, type UpdatePatientData, type PatientQueryParams, type PaginatedPatientResponse } from '$lib/api/patients/client';

// ========== STORE INTERFACES ==========

interface PatientStoreState {
  // Patient Data
  patients: Patient[];
  currentPatient: Patient | null;
  
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  
  // Filters & Search
  filters: {
    search?: string;
    diseaseId?: number;
    hospitalCode?: string;
    treatmentHospital?: string;
    gender?: 'M' | 'F';
    patientCondition?: string;
    illnessDateFrom?: string;
    illnessDateTo?: string;
  };
  
  // Sorting
  sorting: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  
  // Loading States
  loading: {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    export: boolean;
    import: boolean;
  };
  
  // Error States
  errors: {
    list: string | null;
    detail: string | null;
    create: string | null;
    update: string | null;
    delete: string | null;
    export: string | null;
    import: string | null;
  };
  
  // UI States
  ui: {
    selectedPatientIds: number[];
    showCreateModal: boolean;
    showEditModal: boolean;
    showViewModal: boolean;
    showDeleteConfirm: boolean;
    showImportModal: boolean;
    editingPatientId: number | null;
    viewingPatientId: null | number; // Added `| number` for viewingPatientId.
    deletingPatientId: number | null;
  };
}

// ========== INITIAL STATE ==========
const initialState: PatientStoreState = {
  patients: [],
  currentPatient: null,
  
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  },
  
  filters: {},
  
  sorting: {
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  
  loading: {
    list: false,
    detail: false,
    create: false,
    update: false,
    delete: false,
    export: false,
    import: false,
  },
  
  errors: {
    list: null,
    detail: null,
    create: null,
    update: null,
    delete: null,
    export: null,
    import: null,
  },
  
  ui: {
    selectedPatientIds: [],
    showCreateModal: false,
    showEditModal: false,
    showViewModal: false,
    showDeleteConfirm: false,
    showImportModal: false,
    editingPatientId: null,
    viewingPatientId: null,
    deletingPatientId: null,
  },
};

// ========== WRITABLE STORE ==========
export const patientStore = writable<PatientStoreState>(initialState);

// ========== DERIVED STORES ==========

// 📋 Patient list with loading state
export const patientList = derived(
  patientStore,
  ($store) => ({
    patients: $store.patients,
    loading: $store.loading.list,
    error: $store.errors.list,
    pagination: $store.pagination,
  })
);

// 👁️ Current patient detail
export const patientDetail = derived(
  patientStore,
  ($store) => ({
    patient: $store.currentPatient,
    loading: $store.loading.detail,
    error: $store.errors.detail,
  })
);

// 🔍 Search & filter state
export const patientFilters = derived(
  patientStore,
  ($store) => ({
    filters: $store.filters,
    sorting: $store.sorting,
  })
);

// 🎯 Selected patients for bulk operations
export const selectedPatients = derived(
  patientStore,
  ($store) => {
    const selectedIds = $store.ui.selectedPatientIds;
    const selectedPatients = $store.patients.filter(p => selectedIds.includes(p.id));
    return {
      selectedIds,
      selectedPatients,
      selectedCount: selectedIds.length,
    };
  }
);

// 💻 UI state for modals and dialogs
export const patientUI = derived(
  patientStore,
  ($store) => $store.ui
);

// 📊 Quick stats
export const patientStats = derived(
  patientStore,
  ($store) => {
    const patients = $store.patients;
    const total = $store.pagination.total;
    
    return {
      total,
      displayed: patients.length,
      byGender: {
        male: patients.filter(p => p.gender === 'M').length,
        female: patients.filter(p => p.gender === 'F').length,
      },
      byCondition: {
        active: patients.filter(p => p.patientCondition === 'ยังรักษาตัวอยู่').length,
        recovered: patients.filter(p => p.patientCondition === 'หายจากโรคแล้ว').length,
        deceased: patients.filter(p => p.patientCondition === 'เสียชีวิต').length,
      },
    };
  }
);

// ========== STORE ACTIONS ==========

class PatientActions {
  
  // ========== LIST OPERATIONS ==========
  
  /**
   * 📋 Load patients with filters and pagination
   */
  async loadPatients(params?: Partial<PatientQueryParams>) {
    const currentState = get(patientStore);
    
    // Build query parameters
    const queryParams: PatientQueryParams = {
      page: currentState.pagination.page,
      limit: currentState.pagination.limit,
      sortBy: currentState.sorting.sortBy,
      sortOrder: currentState.sorting.sortOrder,
      ...currentState.filters,
      ...params,
    };
    
    // Set loading state
    patientStore.update(state => ({
      ...state,
      loading: { ...state.loading, list: true },
      errors: { ...state.errors, list: null },
    }));
    
    try {
      const response = await patientApi.getPatients(queryParams);
      
      if (response.success && response.data) {
        patientStore.update(state => ({
          ...state,
          patients: response.data!.patients,
          pagination: response.data!.pagination,
          // ไม่ต้องอัปเดต filters ตรงนี้ เพราะเราต้องการให้ filters ถูกกำหนดโดย applyFilters เท่านั้น
          loading: { ...state.loading, list: false },
        }));
      }
    } catch (error) {
      patientStore.update(state => ({
        ...state,
        loading: { ...state.loading, list: false },
        errors: { ...state.errors, list: error instanceof Error ? error.message : 'Failed to load patients' },
      }));
    }
  }
  
  // ✅ แก้ไข: ลบฟังก์ชัน applyFilters ตัวที่สองออก และใช้ฟังก์ชันนี้แทน
  /**
   * 🔍 Apply filters and/or search. Resets pagination to page 1.
   * If an empty object is passed, all filters are cleared.
   */
  async applyFilters(filters: Partial<PatientStoreState['filters']>) {
    patientStore.update(state => ({
      ...state,
      filters: { ...filters }, // ✅ ใช้ { ...filters } เพื่อ "RESET" หรือ "แทนที่" filters ทั้งหมด
      pagination: { ...state.pagination, page: 1 }, // Reset to first page
    }));
    
    await this.loadPatients();
  }

  // ลบ applyFilters ซ้ำออก (ที่เคยเป็นฟังก์ชันที่สอง)
  /*
  async applyFilters(filters: Partial<PatientStoreState['filters']>) {
    patientStore.update(state => ({
      ...state,
      filters: { ...state.filters, ...filters }, // <<=== MERGE FILTER
      pagination: { ...state.pagination, page: 1 }, // Reset to first page
    }));
    
    await this.loadPatients();
  }
  */
  
  /**
   * 📄 Change page
   */
  async changePage(page: number) {
    patientStore.update(state => ({
      ...state,
      pagination: { ...state.pagination, page },
    }));
    
    await this.loadPatients();
  }
  
  /**
   * 🔄 Change sorting
   */
  async changeSorting(sortBy: string, sortOrder: 'asc' | 'desc') {
    patientStore.update(state => ({
      ...state,
      sorting: { sortBy, sortOrder },
      pagination: { ...state.pagination, page: 1 }, // Reset to first page
    }));
    
    await this.loadPatients();
  }
  
  // ========== DETAIL OPERATIONS ==========
  
  /**
   * 👁️ Load patient by ID
   */
  async loadPatientById(id: number) {
    patientStore.update(state => ({
      ...state,
      loading: { ...state.loading, detail: true },
      errors: { ...state.errors, detail: null },
    }));
    
    try {
      const response = await patientApi.getPatientById(id);
      
      if (response.success && response.data) {
        patientStore.update(state => ({
          ...state,
          currentPatient: response.data!,
          loading: { ...state.loading, detail: false },
        }));
      }
    } catch (error) {
      patientStore.update(state => ({
        ...state,
        loading: { ...state.loading, detail: false },
        errors: { ...state.errors, detail: error instanceof Error ? error.message : 'Failed to load patient' },
      }));
    }
  }
  
  // ========== CRUD OPERATIONS ==========
  
  /**
   * ➕ Create new patient
   */
  async createPatient(data: CreatePatientData): Promise<boolean> {
    patientStore.update(state => ({
      ...state,
      loading: { ...state.loading, create: true },
      errors: { ...state.errors, create: null },
    }));
    
    try {
      const response = await patientApi.createPatient(data);
      
      if (response.success && response.data) {
        // Add new patient to the list
        patientStore.update(state => ({
          ...state,
          patients: [response.data!, ...state.patients],
          pagination: { ...state.pagination, total: state.pagination.total + 1 },
          loading: { ...state.loading, create: false },
          ui: { ...state.ui, showCreateModal: false },
        }));
        
        return true;
      }
      return false;
    } catch (error) {
      patientStore.update(state => ({
        ...state,
        loading: { ...state.loading, create: false },
        errors: { ...state.errors, create: error instanceof Error ? error.message : 'Failed to create patient' },
      }));
      return false;
    }
  }
  
  /**
   * ✏️ Update patient
   */
  async updatePatient(id: number, data: UpdatePatientData): Promise<boolean> {
    patientStore.update(state => ({
      ...state,
      loading: { ...state.loading, update: true },
      errors: { ...state.errors, update: null },
    }));
    
    try {
      const response = await patientApi.updatePatient(id, data);
      
      if (response.success && response.data) {
        // Update patient in the list
        patientStore.update(state => ({
          ...state,
          patients: state.patients.map(p => p.id === id ? response.data! : p),
          currentPatient: state.currentPatient?.id === id ? response.data! : state.currentPatient,
          loading: { ...state.loading, update: false },
          ui: { ...state.ui, showEditModal: false, editingPatientId: null },
        }));
        
        return true;
      }
      return false;
    } catch (error) {
      patientStore.update(state => ({
        ...state,
        loading: { ...state.loading, update: false },
        errors: { ...state.errors, update: error instanceof Error ? error.message : 'Failed to update patient' },
      }));
      return false;
    }
  }
  
  /**
   * 🗑️ Delete patient
   */
  async deletePatient(id: number): Promise<boolean> {
    patientStore.update(state => ({
      ...state,
      loading: { ...state.loading, delete: true },
      errors: { ...state.errors, delete: null },
    }));
    
    try {
      const response = await patientApi.deletePatient(id);
      
      if (response.success) {
        // Remove patient from the list
        patientStore.update(state => ({
          ...state,
          patients: state.patients.filter(p => p.id !== id),
          pagination: { ...state.pagination, total: Math.max(0, state.pagination.total - 1) },
          loading: { ...state.loading, delete: false },
          ui: { 
            ...state.ui, 
            showDeleteConfirm: false, 
            deletingPatientId: null,
            selectedPatientIds: state.ui.selectedPatientIds.filter(selectedId => selectedId !== id),
          },
        }));
        
        return true;
      }
      return false;
    } catch (error) {
      patientStore.update(state => ({
        ...state,
        loading: { ...state.loading, delete: false },
        errors: { ...state.errors, delete: error instanceof Error ? error.message : 'Failed to delete patient' },
      }));
      return false;
    }
  }
  
  // ========== UI ACTIONS ==========
  
  /**
   * 🎯 Toggle patient selection
   */
  togglePatientSelection(patientId: number) {
    patientStore.update(state => {
      const selectedIds = state.ui.selectedPatientIds;
      const newSelectedIds = selectedIds.includes(patientId)
        ? selectedIds.filter(id => id !== patientId)
        : [...selectedIds, patientId];
      
      return {
        ...state,
        ui: { ...state.ui, selectedPatientIds: newSelectedIds },
      };
    });
  }
  
  /**
   * 🎯 Select all patients on current page
   */
  selectAllPatients() {
    patientStore.update(state => ({
      ...state,
      ui: { 
        ...state.ui, 
        selectedPatientIds: state.patients.map(p => p.id),
      },
    }));
  }
  
  /**
   * 🎯 Clear selection
   */
  clearSelection() {
    patientStore.update(state => ({
      ...state,
      ui: { ...state.ui, selectedPatientIds: [] },
    }));
  }
  
  /**
   * 📝 Open create modal
   */
  openCreateModal() {
    patientStore.update(state => ({
      ...state,
      ui: { ...state.ui, showCreateModal: true },
      errors: { ...state.errors, create: null },
    }));
  }
  
  /**
   * ✏️ Open edit modal
   */
  openEditModal(patientId: number) {
    patientStore.update(state => ({
      ...state,
      ui: { 
        ...state.ui, 
        showEditModal: true, 
        editingPatientId: patientId,
      },
      errors: { ...state.errors, update: null },
    }));
    
    // Load patient data for editing
    this.loadPatientById(patientId);
  }
  
  /**
   * 👁️ Open view modal
   */
  openViewModal(patientId: number) {
    patientStore.update(state => ({
      ...state,
      ui: { 
        ...state.ui, 
        showViewModal: true, 
        viewingPatientId: patientId,
      },
    }));
    
    // Load patient data for viewing
    this.loadPatientById(patientId);
  }
  
  /**
   * 🗑️ Open delete confirmation
   */
  openDeleteConfirm(patientId: number) {
    patientStore.update(state => ({
      ...state,
      ui: { 
        ...state.ui, 
        showDeleteConfirm: true, 
        deletingPatientId: patientId,
      },
    }));
  }
  
  /**
   * ❌ Close all modals
   */
  closeAllModals() {
    patientStore.update(state => ({
      ...state,
      ui: {
        ...state.ui,
        showCreateModal: false,
        showEditModal: false,
        showViewModal: false,
        showDeleteConfirm: false,
        showImportModal: false,
        editingPatientId: null,
        viewingPatientId: null,
        deletingPatientId: null,
      },
      currentPatient: null,
      errors: {
        ...state.errors,
        create: null,
        update: null,
        delete: null,
      },
    }));
  }
  
  /**
   * 🧹 Clear all errors
   */
  clearErrors() {
    patientStore.update(state => ({
      ...state,
      errors: {
        list: null,
        detail: null,
        create: null,
        update: null,
        delete: null,
        export: null,
        import: null,
      },
    }));
  }
  
  /**
   * 🔄 Reset store to initial state
   */
  reset() {
    patientStore.set(initialState);
  }
}

// ========== EXPORT ACTIONS INSTANCE ==========
export const patientActions = new PatientActions();