export const API_CONFIG = {
  BROKER: 'http://ec2-13-202-238-201.ap-south-1.compute.amazonaws.com:8080/broker/api',
  TRADE: 'http://ec2-13-233-121-193.ap-south-1.compute.amazonaws.com:8081/api',
} as const;

export const ENDPOINTS = {
  // Client Management
  CLIENT_LIST: '/client/list',
  CLIENT_ADD: '/client/add',
  CLIENT_DELETE: (code: string) => `/client/delete/${code}`,
  CLIENT_AUTH: (code: string) => `/client/authenticate/${code}`,
  CLIENT_AUTH_ALL: '/client/authenticate-all',
  CLIENT_LOGOUT: (code: string) => `/client/logout/${code}`,
  
  // Trading
  PLACE_ORDER: '/trade/place-order',
  CANCEL_ORDER: '/trade/cancel-order-all',
  
  // Logs
  LOGS_REQUEST: (id: string) => `/logs/request/${id}`,
  LOGS_TRACE: (id: string) => `/logs/trace/${id}`,
  LOGS_CLIENT: (code: string) => `/logs/client/${code}`,
  LOGS_ENDPOINT: '/logs/endpoint',
  LOGS_STATUS: (status: string) => `/logs/status/${status}`,
  LOGS_TIMELINE: '/logs/timeline',
  LOGS_STATS: (endpoint: string) => `/logs/stats/endpoint/${endpoint}`,
} as const;
