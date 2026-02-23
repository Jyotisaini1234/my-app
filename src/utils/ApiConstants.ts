export const BROKER_BASE = 'http://ec2-13-202-238-201.ap-south-1.compute.amazonaws.com:8080/broker';
export const TRADE_BASE  = 'http://localhost:8081';


export const API_ENDPOINTS = {

  CLIENT: {
    LIST:             '/api/client/list',
    LIST_ACTIVE:      '/api/client/active',
    ADD:              '/api/client/add',
    DETAILS:          (code: string) => `/api/client/details/${code}`,
    AUTHENTICATE:     (code: string) => `/api/client/authenticate/${code}`,
    AUTHENTICATE_ALL: '/api/client/authenticate-all',
    UPDATE:           (code: string) => `/api/client/update/${code}`,
    UPDATE_FIELD:     (code: string) => `/api/client/update-field/${code}`,
    DELETE:           (code: string) => `/api/client/delete/${code}`,
  },

  BROKER: {
    PLACE_ORDER:    '/api/broker/place-order',
    CANCEL_ORDER:   '/api/broker/cancel-order',
    PROFILE:        (code: string) => `/api/broker/profile/${code}`,
    SEARCH_SYMBOLS: '/api/broker/search-symbols',
    HEALTH:         '/api/broker/health',
  },

  TRADE: {
    PLACE_ORDER:   '/api/trade/place-order',
    CANCEL_ORDER:  '/api/trade/cancel-order-all',  
    HEALTH:        '/api/trade/health',
    CONFIG:        '/api/trade/config',
  },

  LOGS: {
    TRACE:           (id: string)   => `/api/logs/trace/${id}`,
    SPAN:            (id: string)   => `/api/logs/span/${id}`,
    TRACE_SPAN:      (t: string, s: string) => `/api/logs/trace/${t}/span/${s}`,
    CLIENT:          (code: string) => `/api/logs/client/${code}`,
    CLIENT_NAME:     (name: string) => `/api/logs/client-name/${name}`,
    CLIENT_GROUPED:  (code: string) => `/api/logs/client/${code}/grouped`,
    DATA_ALL:        '/api/logs/data/all',
    DATA_COUNT:      '/api/logs/data/count',
  },

  EXPORT: {
    LIST_REMOTE:     '/api/logs/export/list-remote',
    DOWNLOAD_REMOTE: (file: string) => `/api/logs/export/download-remote/${file}`,
    UPLOAD_ARCHIVE:  '/api/logs/export/upload-archive',
    DELETE_REMOTE:   (file: string) => `/api/logs/export/delete-remote/${file}`,
    RESTORE_ARCHIVE: (file: string) => `/api/logs/export/restore-archive/${file}`,
    LOKI_STATUS:     '/api/logs/export/loki-data-status',
  },

} as const;