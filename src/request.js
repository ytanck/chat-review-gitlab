import axios from 'axios';

const createRequest = (host, { headers, data, params }) => {
  const instance = axios.create({
    baseURL: host,
    timeout: 10000,
  });

  instance.interceptors.request.use(
    function (config) {
      if (params) {
        config.params = { ...params, ...config.params };
      }
      if (headers) {
        config.headers.set(headers);
      }

      if (data) {
        config.data = { ...data, ...config.data };
      }
      return config;
    },
    function (error) {
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    function (response) {
      return response;
    },
    function (error) {
      console.log(error);
      return Promise.reject(error);
    }
  );

  return instance;
};

export default createRequest;
