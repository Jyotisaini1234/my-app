export const API_BASE_URL_8080 = 'http://ec2-13-202-238-201.ap-south-1.compute.amazonaws.com:8080/broker/api';
export const API_BASE_URL_8081 ='http://ec2-13-233-121-193.ap-south-1.compute.amazonaws.com:8081/api/trade';


export const API_ENDPOINTS = {
    CLIENTS: {
      LIST: '/client/list',
      ADD: '/client/add',
      DELETE: (code: string) => `/client/delete/${code}`,
      AUTHENTICATE: (code: string) => `/client/authenticate/${code}`,
      AUTHENTICATE_ALL: '/client/authenticate-all',
      LOGOUT: (code: string) => `/client/logout/${code}`,
    },
    TRADE: {
      PLACE_ORDER: `${API_BASE_URL_8081}/place-order`,
      PLACE_SINGLE_ORDER: `${API_BASE_URL_8081}/place-single-order`,
      CANCEL_ORDER: `${API_BASE_URL_8081}/trade/cancel-order-all`,
      CANCEL_SINGLE_ORDER: `${API_BASE_URL_8081}/trade/cancel-order`,
    },
  };