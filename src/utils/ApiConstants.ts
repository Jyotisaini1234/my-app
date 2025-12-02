
export const API_BASE_URL_8080 = 'http://ec2-13-202-238-201.ap-south-1.compute.amazonaws.com:8080/broker';
export const API_BASE_URL_8081 = 'http://ec2-13-233-121-193.ap-south-1.compute.amazonaws.com:8081';

export const API_ENDPOINTS = {
  CLIENTS: {
    LIST: '/api/client/list',
    ADD: '/api/client/add',
    DELETE: (code: string) => `/api/client/delete/${code}`,
    AUTHENTICATE: (code: string) => `/api/client/authenticate/${code}`,
    AUTHENTICATE_ALL: '/api/client/authenticate-all',
    LOGOUT: (code: string) => `/api/client/logout/${code}`,
  },
  
  TRADE: {
    PLACE_ORDER: '/api/trade/place-order',
    CANCEL_ORDER: '/api/trade/cancel-order-all',
    CANCEL_SINGLE_ORDER: '/api/trade/cancel-order',
  },
  
  BROKER: {
    SEARCH_SYMBOLS: '/api/broker/search-symbols',
    PLACE_ORDER: '/api/broker/place-order',
    CANCEL_ORDER: '/api/broker/cancel-order',
    PROFILE: (clientCode: string) => `/api/broker/profile/${clientCode}`,
    HEALTH: '/api/broker/health',
  },
  
  LOGS: {
    DATA_ALL: '/api/logs/data/all',
    REQUEST: (id: string) => `/api/logs/request/${id}`,
    TRACE: (id: string) => `/api/logs/trace/${id}`,
    SPAN: (id: string) => `/api/logs/span/${id}`,
    CLIENT: (code: string) => `/api/logs/client/${code}`,
    ENDPOINT: '/api/logs/endpoint',
    STATUS: (status: string) => `/api/logs/status/${status}`,
    TIMELINE: '/api/logs/timeline',
    STATS: (endpoint: string) => `/api/logs/stats/endpoint/${endpoint}`,
  }
} as const;

export const API_CONFIG = {
  BROKER: `${API_BASE_URL_8080}`,
  TRADE: API_BASE_URL_8081,
} as const;

export const ENDPOINTS = {
  CLIENT_LIST: '/api/client/list',
  CLIENT_ADD: '/api/client/add',
  CLIENT_DELETE: (code: string) => `/api/client/delete/${code}`,
  CLIENT_AUTH: (code: string) => `/api/client/authenticate/${code}`,
  CLIENT_AUTH_ALL: '/api/client/authenticate-all',
  CLIENT_LOGOUT: (code: string) => `/api/client/logout/${code}`,
  
  PLACE_ORDER: '/api/trade/place-order',
  PLACE_SINGLE_ORDER: '/api/trade/place-single-order',
  CANCEL_ORDER: '/api/trade/cancel-order-all',
  CANCEL_SINGLE_ORDER: '/api/trade/cancel-order',
  
  LOGS_DATA_ALL: '/api/logs/data/all',
  LOGS_REQUEST: (id: string) => `/api/logs/request/${id}`,
  LOGS_TRACE: (id: string) => `/api/logs/trace/${id}`,
  LOGS_SPAN: (id: string) => `/api/logs/span/${id}`,
  LOGS_CLIENT: (code: string) => `/api/logs/client/${code}`,
  LOGS_ENDPOINT: '/api/logs/endpoint',
  LOGS_STATUS: (status: string) => `/api/logs/status/${status}`,
  LOGS_TIMELINE: '/api/logs/timeline',
  LOGS_STATS: (endpoint: string) => `/api/logs/stats/endpoint/${endpoint}`,
} as const;

// Helper function to build full URL
export const buildUrl = (base: keyof typeof API_CONFIG, endpoint: string) => {
  return `${API_CONFIG[base]}${endpoint}`;
};