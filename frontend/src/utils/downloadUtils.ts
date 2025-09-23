import axios from 'axios';
import env from '../config/env';

export async function downloadBatchZip(fileIds: string[], filenamePrefix = 'omni_media') {
  const response = await axios.post<Blob>(
    `${env.BASE_URL}/api/media/batch-download`,
    { fileIds },
    {
      responseType: 'blob',
      timeout: fileIds.length > 10 ? 60000 : 30000,
    }
  );

  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filenamePrefix}_${Date.now()}.zip`);
  document.body.appendChild(link);
  link.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(link);
}


