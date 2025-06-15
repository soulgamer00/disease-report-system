// frontend/src/lib/reports/constants.ts
// Constants for charts, filters, and UI elements

// Chart Color Schemes
export const CHART_COLORS = {
  // Primary theme colors
  PRIMARY: 'rgba(13, 123, 95, 0.8)',
  SECONDARY: 'rgba(16, 185, 129, 0.8)',
  ACCENT: 'rgba(6, 182, 212, 0.8)',
  
  // Gender colors
  MALE: 'rgba(59, 130, 246, 0.8)',
  FEMALE: 'rgba(236, 72, 153, 0.8)',
  OTHER: 'rgba(139, 92, 246, 0.8)',
  
  // Status colors
  SUCCESS: 'rgba(16, 185, 129, 0.8)',
  WARNING: 'rgba(245, 158, 11, 0.8)',
  DANGER: 'rgba(239, 68, 68, 0.8)',
  INFO: 'rgba(59, 130, 246, 0.8)',
  
  // Age group gradient
  AGE_GRADIENT: [
    'rgba(224, 242, 254, 0.8)', // Very light blue
    'rgba(186, 230, 253, 0.8)', // Light blue
    'rgba(125, 211, 252, 0.8)', // Blue
    'rgba(56, 189, 248, 0.8)',  // Medium blue
    'rgba(14, 165, 233, 0.8)',  // Dark blue
    'rgba(2, 132, 199, 0.8)',   // Darker blue
    'rgba(3, 105, 161, 0.8)',   // Very dark blue
    'rgba(12, 74, 110, 0.8)',   // Deep blue
    'rgba(30, 58, 138, 0.8)',   // Navy
    'rgba(30, 41, 59, 0.8)'     // Very dark navy
  ],
  
  // Occupation colors (broader palette)
  OCCUPATION_PALETTE: [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(16, 185, 129, 0.8)',   // Green
    'rgba(245, 158, 11, 0.8)',   // Yellow
    'rgba(239, 68, 68, 0.8)',    // Red
    'rgba(139, 92, 246, 0.8)',   // Purple
    'rgba(236, 72, 153, 0.8)',   // Pink
    'rgba(6, 182, 212, 0.8)',    // Cyan
    'rgba(251, 146, 60, 0.8)',   // Orange
    'rgba(34, 197, 94, 0.8)',    // Lime
    'rgba(168, 85, 247, 0.8)'    // Violet
  ]
} as const;

// Filter Options
export const FILTER_OPTIONS = {
  // Year options (current year - 5 to current year + 1)
  YEARS: (() => {
    const currentYear = new Date().getFullYear();
    const years = ['all'];
    for (let year = currentYear; year >= currentYear - 5; year--) {
      years.push(year.toString());
    }
    return years;
  })(),
  
  // Gender options
  GENDERS: [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'M', label: 'ชาย' },
    { value: 'F', label: 'หญิง' }
  ],
  
  // Age group options
  AGE_GROUPS: [
    { value: 'all', label: 'ทั้งหมด' },
    { value: '0-10', label: '0-10 ปี' },
    { value: '11-20', label: '11-20 ปี' },
    { value: '21-30', label: '21-30 ปี' },
    { value: '31-40', label: '31-40 ปี' },
    { value: '41-50', label: '41-50 ปี' },
    { value: '51+', label: '51+ ปี' }
  ],
  
  // Common occupations for filter
  OCCUPATIONS: [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'นักเรียน', label: 'นักเรียน' },
    { value: 'นักศึกษา', label: 'นักศึกษา' },
    { value: 'ในปกครอง', label: 'ในปกครอง' },
    { value: 'รับราชการ', label: 'รับราชการ' },
    { value: 'รัฐวิสาหิจ', label: 'รัฐวิสาหิจ' },
    { value: 'รับจ้างทั่วไป', label: 'รับจ้างทั่วไป' },
    { value: 'ธุรกิจส่วนตัว', label: 'ธุรกิจส่วนตัว' },
    { value: 'เกษตรกร', label: 'เกษตรกร' },
    { value: 'พนักงานภาครัฐ', label: 'พนักงานภาครัฐ' },
    { value: 'พนักงานเอกชน', label: 'พนักงานเอกชน' },
    { value: 'แม่บ้าน/พ่อบ้าน', label: 'แม่บ้าน/พ่อบ้าน' },
    { value: 'นักบวช/สมณะ', label: 'นักบวช/สมณะ' },
    { value: 'ค้าขาย', label: 'ค้าขาย' },
    { value: 'ไม่มีอาชีพ', label: 'ไม่มีอาชีพ' },
    { value: 'อื่นๆ', label: 'อื่นๆ' }
  ]
} as const;

// Chart Default Options
export const CHART_DEFAULTS = {
  // Common options for all charts
  COMMON: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          font: {
            family: "'Noto Sans Thai', sans-serif",
            size: 12
          }
        }
      }
    }
  },
  
  // Bar chart specific
  BAR: {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            family: "'Noto Sans Thai', sans-serif"
          }
        }
      },
      x: {
        ticks: {
          font: {
            family: "'Noto Sans Thai', sans-serif"
          }
        }
      }
    }
  },
  
  // Pie chart specific
  PIE: {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          font: {
            family: "'Noto Sans Thai', sans-serif",
            size: 12
          }
        }
      }
    }
  }
} as const;

// UI Text Constants
export const UI_TEXT = {
  // Loading states
  LOADING: {
    DISEASES: 'กำลังโหลดข้อมูลโรค...',
    HOSPITALS: 'กำลังโหลดข้อมูลโรงพยาบาล...',
    FILTERS: 'กำลังโหลดตัวกรอง...',
    AGE_GROUPS: 'กำลังโหลดข้อมูลกลุ่มอายุ...',
    GENDER_RATIO: 'กำลังโหลดข้อมูลอัตราส่วนเพศ...',
    INCIDENCE_RATES: 'กำลังโหลดข้อมูลอัตราการป่วยและตาย...',
    OCCUPATION: 'กำลังโหลดข้อมูลอาชีพ...'
  },
  
  // Error messages
  ERROR: {
    NETWORK: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
    NOT_FOUND: 'ไม่พบข้อมูลที่ระบุ',
    INVALID_DISEASE: 'รหัสโรคไม่ถูกต้อง',
    NO_DATA: 'ไม่มีข้อมูลในช่วงเวลาที่เลือก',
    GENERIC: 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
  },
  
  // Empty states
  EMPTY: {
    DISEASES: 'ไม่พบข้อมูลโรค',
    HOSPITALS: 'ไม่พบข้อมูลโรงพยาบาล',
    PATIENTS: 'ไม่พบข้อมูลผู้ป่วย',
    REPORTS: 'ไม่มีข้อมูลสำหรับสร้างรายงาน'
  },
  
  // Success messages
  SUCCESS: {
    DATA_LOADED: 'โหลดข้อมูลสำเร็จ',
    FILTER_APPLIED: 'ใช้ตัวกรองสำเร็จ'
  }
} as const;

// Utility function to get color by index
export function getColorByIndex(index: number, palette: readonly string[] = CHART_COLORS.OCCUPATION_PALETTE): string {
  return palette[index % palette.length];
}

// Utility function to get age group color
export function getAgeGroupColor(index: number): string {
  return CHART_COLORS.AGE_GRADIENT[index % CHART_COLORS.AGE_GRADIENT.length];
}