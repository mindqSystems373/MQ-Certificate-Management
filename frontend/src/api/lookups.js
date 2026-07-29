import axiosClient from './axiosClient';

function makeLookupApi(resource) {
  return {
    list: () => axiosClient.get(`/${resource}`).then((r) => r.data),
    create: (payload) => axiosClient.post(`/${resource}`, payload).then((r) => r.data),
    update: (id, payload) => axiosClient.put(`/${resource}/${id}`, payload).then((r) => r.data),
    deactivate: (id) => axiosClient.delete(`/${resource}/${id}`).then((r) => r.data),
  };
}

export const coursesApi = makeLookupApi('courses');
export const facultiesApi = makeLookupApi('faculties');
export const gradesApi = makeLookupApi('grades');
