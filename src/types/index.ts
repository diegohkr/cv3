export interface User {
  id: string;
  email: string;
  name: string | null;
  password?: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  chineseName: string;
  legalRepresentative: string;
  registeredCapital: string;
  paidCapital: string;
  establishmentDate: string;
  establishmentYear: string;
  age: string;
  province: string;
  address: string;
  cantonWebsite: string;
  officialWebsite: string;
  telephone: string;
  morePhones: string;
  email: string;
  cantonEmail: string;
  moreEmails: string;
  enterpriseType: string;
  socialCreditCode: string;
  taxpayerID: string;
  registrationNumber: string;
  organizationCode: string;
  declaredInCanton: string;
  realInsuredEmployees: string;
  enterpriseScale: string;
  companyStand: string;
  category: string;
  industryCategory: string;
  companyProfile: string;
  businessScope: string;
  creditRateScoring: string;
  creditRating: string;
  cantonPhase: string;
  cantonStandNo: string;
  canton2ndStand: string;
  canton2ndStandLocation: string;
  cantonResponsiblePerson: string;
  cantonPhoneNo: string;
  cantonPhoneNo2: string;
  cantonMainProducts: string;
  cantonMainKeywords: string;
  cantonTypeOfCompany: string;
  cantonTradeForm: string;
  cantonInnovationAward: string;
  cantonFairAward: string;
  cantonMultipleEditions: string;
  cantonBrandExhibitor: string;
  cantonTimeHonoredBrand: string;
  cantonRuralRevitalization: string;
  cantonNewExhibitor: string;
  cantonSpecializedEnterprise: string;
  cantonGreenAward: string;
  cantonCustomsCertified: string;
  cantonHighTechExhibitor: string;
  cantonHighTechEnterprise: string;
  products: string[];
  contact: {
    telephone: string;
    cantonPhone: string;
    email: string;
    cantonEmail: string;
    website: string;
  };
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  conversationId: string;
  attachments: string[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  messages: Message[];
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
}

export interface FileUpload {
  file: File;
  type: 'image' | 'pdf' | 'document';
  content?: string;
  preview?: string;
}

export interface CompanyReportJSON {
  company_report: {
    company_name_en: string;
    company_name_cn: string;
    general_info: {
      province: string;
      full_address: string;
      year_established: string;
      company_age: string;
      company_type: string;
    };
    legal_financial_info: {
      registered_capital_millions_cny: string;
      paid_in_capital_millions_cny: string;
      credit_code: string;
      business_scale: string;
      insured_employees: string;
      credit_scoring: string;
      credit_rating: string;
    };
    contact_info: {
      phones: string[];
      emails: string[];
      official_website: string;
      canton_website: string;
    };
    main_products: Array<{
      product_cn: string;
      product_es: string;
    }>;
    company_profile: string;
  };
}

export interface CompanyExtractedData {
  chineseName?: string;
  englishName?: string;
  website?: string;
  domains?: string[];
  brands?: string[];
  contact?: string;
  email?: string;
  address?: string;
  products?: string[];
  rawText?: string;
}
