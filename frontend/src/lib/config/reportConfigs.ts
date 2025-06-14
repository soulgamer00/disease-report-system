// src/lib/configs/reportConfigs.ts
// 🛡️ FULLY Type-Safe Smart Configuration Engine (80 lines)

import { publicApi, type AgeGroupsReport, type GenderRatioReport, type IncidenceRatesReport, type OccupationReport } from '$lib/services/api';

// ========== STRICT TYPE DEFINITIONS ==========
interface FilterOption {
  value: string;
  label: string;
}

interface CacheEntry<T> {
  data: T;
  time: number;
}

interface SmartInsights {
  mostAffected?: string;
  highestIncidence?: string;
  distributionTrend?: string;
  riskLevel?: string;
  ratio?: string;
  dominantGender?: string;
  bias?: string;
  diversity?: string;
  error?: string;
}

type ReportData = AgeGroupsReport | GenderRatioReport | IncidenceRatesReport | OccupationReport;
type AnalyzerFunction<T extends ReportData> = (data: T) => SmartInsights;

// ========== TYPE-SAFE DATA ENGINE ==========
class TypeSafeConfigEngine {
  private static cache = new Map<string, CacheEntry<unknown>>();
  private static readonly CACHE_TIME = 5 * 60 * 1000; // 5 minutes

  // 🛡️ Type-safe Years from ACTUAL patient data
  static async getAvailableYears(): Promise<string[]> {
    return this.cached<string[]>('years', async (): Promise<string[]> => {
      try {
        const response = await fetch('/public/patients/years', { method: 'GET' });
        const result = await response.json() as { data: number[] };
        return ['all', ...result.data.sort((a: number, b: number) => b - a).map(year => year.toString())];
      } catch {
        const currentYear = new Date().getFullYear();
        return ['all', ...Array.from({ length: 10 }, (_, i) => (currentYear - i).toString())];
      }
    });
  }

  // 🛡️ Type-safe Hospitals from ACTUAL database
  static async getActiveHospitals(): Promise<FilterOption[]> {
    return this.cached<FilterOption[]>('hospitals', async (): Promise<FilterOption[]> => {
      const response = await publicApi.hospitals();
      return [
        { value: 'all', label: 'ทั้งหมด' },
        ...response.data.map((hospital): FilterOption => ({
          value: hospital.value || hospital.code || '',
          label: hospital.label || 'ไม่ระบุชื่อ'
        }))
      ];
    });
  }

  // 🛡️ Type-safe Occupations from ACTUAL patient data
  static async getOccupations(): Promise<FilterOption[]> {
    return this.cached<FilterOption[]>('occupations', async (): Promise<FilterOption[]> => {
      try {
        const response = await fetch('/public/patients/occupations', { method: 'GET' });
        const result = await response.json() as { data: string[] };
        return [
          { value: 'all', label: 'ทั้งหมด' },
          ...result.data.map((occupation: string): FilterOption => ({ value: occupation, label: occupation }))
        ];
      } catch {
        return [{ value: 'all', label: 'ทั้งหมด' }];
      }
    });
  }

  // 🛡️ Type-safe Age Groups
  static async getAgeGroups(): Promise<FilterOption[]> {
    return this.cached<FilterOption[]>('ageGroups', async (): Promise<FilterOption[]> => {
      try {
        const response = await fetch('/public/patients/age-ranges', { method: 'GET' });
        const result = await response.json() as { data: Array<{ range: string; label: string }> };
        return [
          { value: 'all', label: 'ทั้งหมด' },
          ...result.data.map(({ range, label }): FilterOption => ({ value: range, label }))
        ];
      } catch {
        return [
          { value: 'all', label: 'ทั้งหมด' },
          { value: '0-4', label: 'ทารก-เด็กเล็ก (0-4 ปี)' },
          { value: '5-14', label: 'เด็กโต (5-14 ปี)' },
          { value: '15-24', label: 'วัยรุ่น (15-24 ปี)' },
          { value: '25-44', label: 'วัยทำงาน (25-44 ปี)' },
          { value: '45-64', label: 'วัยกลางคน (45-64 ปี)' },
          { value: '65+', label: 'ผู้สูงอายุ (65+ ปี)' }
        ];
      }
    });
  }

  // 🛡️ Type-safe Caching System
  private static async cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    if (cached && (Date.now() - cached.time) < this.CACHE_TIME) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, time: Date.now() });
    return data;
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

// ========== TYPE-SAFE ANALYZERS ==========
const typeSafeAnalyzers = {
  ageGroups: (data: AgeGroupsReport): SmartInsights => {
    const groups = data.ageGroups.filter(group => group.count > 0);
    if (groups.length === 0) return { error: 'ไม่มีข้อมูล' };

    const total = groups.reduce((sum, group) => sum + group.count, 0);
    const mostAffected = groups.reduce((max, current) => current.count > max.count ? current : max);
    const highestRate = groups.reduce((max, current) => current.incidenceRate > max.incidenceRate ? current : max);
    
    const variance = groups.reduce((acc, group) => acc + Math.pow(group.count - total / groups.length, 2), 0) / groups.length;
    const trend = variance < (total / groups.length) * 0.5 ? 'กระจายสม่ำเสมอ' : 'มีกลุ่มเสี่ยงเฉพาะ';

    return {
      mostAffected: `${mostAffected.ageGroup} (${mostAffected.count.toLocaleString()} คน)`,
      highestIncidence: `${highestRate.ageGroup} (${highestRate.incidenceRate.toFixed(2)}/แสน)`,
      distributionTrend: trend,
      riskLevel: mostAffected.percentage > 40 ? 'เสี่ยงสูง' : 'เสี่ยงปกติ'
    };
  },

  genderRatio: (data: GenderRatioReport): SmartInsights => {
    const { male, female, other, total } = data.summary;
    if (total === 0) return { error: 'ไม่มีข้อมูล' };

    const ratio = female > 0 ? `${(male / female).toFixed(1)}:1` : `${male}:0`;
    const genderBias = Math.abs(male - female) / total;
    const dominance = male > female * 1.2 ? 'ชายมากกว่า' : female > male * 1.2 ? 'หญิงมากกว่า' : 'สมดุล';

    return {
      ratio,
      dominantGender: dominance,
      bias: genderBias > 0.3 ? 'เอียงมาก' : genderBias > 0.1 ? 'เอียงเล็กน้อย' : 'สมดุล',
      diversity: other > 0 ? 'มีความหลากหลาย' : 'แบ่งแยกชัด'
    };
  }
} as const;

// ========== TYPE-SAFE EXPORT API ==========
export const typeSafeConfig = {
  async init(): Promise<void> {
    await Promise.all([
      TypeSafeConfigEngine.getAvailableYears(),
      TypeSafeConfigEngine.getActiveHospitals(),
      TypeSafeConfigEngine.getOccupations(),
      TypeSafeConfigEngine.getAgeGroups()
    ]);
    console.log('🛡️ Type-Safe Config initialized with REAL data');
  },

  filters: {
    years: (): Promise<string[]> => TypeSafeConfigEngine.getAvailableYears(),
    hospitals: (): Promise<FilterOption[]> => TypeSafeConfigEngine.getActiveHospitals(),
    occupations: (): Promise<FilterOption[]> => TypeSafeConfigEngine.getOccupations(),
    ageGroups: (): Promise<FilterOption[]> => TypeSafeConfigEngine.getAgeGroups(),
    genders: (): Promise<FilterOption[]> => Promise.resolve([
      { value: 'all', label: 'ทั้งหมด' },
      { value: 'ชาย', label: 'ชาย' },
      { value: 'หญิง', label: 'หญิง' },
      { value: 'อื่นๆ', label: 'อื่นๆ' }
    ])
  },

  analyze<T extends keyof typeof typeSafeAnalyzers>(
    reportType: T,
    data: T extends 'ageGroups' ? AgeGroupsReport : T extends 'genderRatio' ? GenderRatioReport : never
  ): SmartInsights {
    const analyzer = typeSafeAnalyzers[reportType];
    return analyzer(data as Parameters<typeof analyzer>[0]);
  },

  refresh(): void {
    TypeSafeConfigEngine.clearCache();
  }
} as const;

export default typeSafeConfig;