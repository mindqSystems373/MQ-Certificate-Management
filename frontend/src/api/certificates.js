import axiosClient from './axiosClient';

export const searchCertificates = (params) => axiosClient.get('/certificates/search', { params }).then((r) => r.data);
export const getCertificateByNumber = (number) => axiosClient.get(`/certificates/${number}`).then((r) => r.data);
export const resendCertificate = (number) => axiosClient.post(`/certificates/${number}/resend`).then((r) => r.data);

export const downloadCertificateUrl = (number) => `/api/certificates/${number}/download`;

// A plain <a href> download won't carry the Authorization header, so the
// download button fetches the PDF as a blob (with the JWT attached) and then
// triggers a client-side save — same UX, but respects the protected route.
export async function downloadCertificate(number) {
  const res = await axiosClient.get(`/certificates/${number}/download`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${number}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
