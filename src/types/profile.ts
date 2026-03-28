export interface BrokerEntry {
  enabled:          boolean;
  is_authenticated: boolean;
  user_id?:         string;
  current_totp?:    string;
  totp_expires_in?: number;
  last_login?:      Record<string, unknown>;
  token_expiry?:    Record<string, unknown>;
}

export interface BankDetail {
  bankn?:     string;
  acctnum?:   string;
  ifsc_code?: string;
}

export interface DpAccount {
  dpnum?: string;
}

export interface ShoonyaProfile {
  stat?:           string;
  client_name?:    string;
  user_name?:      string;
  uid?:            string;
  email?:          string;
  mobile?:         string;
  pan?:            string;
  dob?:            string;
  role?:           string;
  account_status?: string;
  broker_name?:    string;
  exchanges?:      string[];
  order_types?:    string[];
  bank_details?:   BankDetail[];
  dp_account?:     DpAccount[];
  message?:        string;
  emsg?:           string;
  [key: string]:   unknown;
}

export interface UserInfo {
  clientCode?: string;
  name?:       string;
  email?:      string;
  phone?:      string;
  city?:       string;
  [key: string]: unknown;
}
