import axiosClient from './axiosClient';

export const createStudent = (payload) => axiosClient.post('/students', payload).then((r) => r.data);
export const listStudents = (params) => axiosClient.get('/students', { params }).then((r) => r.data);
export const getStudent = (id) => axiosClient.get(`/students/${id}`).then((r) => r.data);
export const approveStudents = (studentIds) => axiosClient.post('/students/approve', { studentIds }).then((r) => r.data);
