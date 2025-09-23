import { GridRowSelectionModel } from '@mui/x-data-grid';
import { downloadBatchZip } from '../../../utils/downloadUtils';

export async function handleDownloadSelected(
  selected: GridRowSelectionModel,
  rows: any[],
  safeToast: (type: 'success' | 'error' | 'info' | 'warning', message: string, options?: any) => void,
  setDownloading: (v: boolean) => void
) {
  if (selected.length === 0) {
    safeToast('info', 'No files selected for download', { autoClose: 2000 });
    return;
  }

  try {
    setDownloading(true);
    const fileIds = selected
      .map((id) => rows.find((row) => row.id === id)?.id || '')
      .filter((id) => id !== '');

    if (fileIds.length > 0) {
      safeToast('info', `Preparing ${fileIds.length} files for download...`, { autoClose: 2000 });
      try {
        await downloadBatchZip(fileIds, 'omni_media');
        safeToast('success', `Downloaded ${selected.length} files`, { autoClose: 3000 });
      } catch (downloadError: any) {
        if (downloadError?.code === 'ECONNABORTED') {
          safeToast('error', 'Download timed out. Please try downloading fewer files at once.', { autoClose: 4000 });
        } else if (downloadError?.response?.status === 413) {
          safeToast('error', 'Batch too large. Please select fewer files and try again.', { autoClose: 4000 });
        } else {
          safeToast('error', 'Failed to download files. Please try again.', { autoClose: 4000 });
        }
      }
    }
  } catch (error) {
    safeToast('error', 'Failed to prepare files for download. Please try again.', { autoClose: 4000 });
  } finally {
    setDownloading(false);
  }
}

export function handleDeleteSelected(
  selected: GridRowSelectionModel,
  setIsToolbarDelete: (v: boolean) => void,
  setIsModalOpen: (v: boolean) => void
) {
  if (selected.length > 0) {
    setIsToolbarDelete(true);
    setIsModalOpen(true);
  }
}

export async function handleConfirmDelete(
  isToolbarDelete: boolean,
  selected: GridRowSelectionModel,
  rows: any[],
  onDeleteMedia: (id: string) => Promise<boolean>,
  safeToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void,
  selectedFileId: string | null,
  setSelectedFileId: (id: string | null) => void,
  setSelected: (updater: (prev: GridRowSelectionModel) => GridRowSelectionModel) => void,
  setIsModalOpen: (v: boolean) => void,
  setIsToolbarDelete: (v: boolean) => void
) {
  let successfullyDeletedIds: string[] = [];
  if (isToolbarDelete) {
    const numSelected = selected.length;
    if (numSelected === 0) {
      safeToast('info', 'No files were selected for deletion.');
      setIsModalOpen(false);
      setIsToolbarDelete(false);
      return;
    }

    const promises = selected.map((id) => onDeleteMedia(id as string).then((success) => ({ id: id as string, success })));
    const results = await Promise.all(promises);
    successfullyDeletedIds = results.filter((r) => r.success).map((r) => r.id);
    const successfulDeletionsCount = successfullyDeletedIds.length;

    if (successfulDeletionsCount === numSelected && numSelected > 0) {
      safeToast('success', `${successfulDeletionsCount} media file${successfulDeletionsCount > 1 ? 's' : ''} deleted successfully.`);
    } else if (successfulDeletionsCount > 0 && successfulDeletionsCount < numSelected) {
      safeToast('warning', `${successfulDeletionsCount} out of ${numSelected} media files deleted. Some deletions may have failed.`);
    } else if (numSelected > 0 && successfulDeletionsCount === 0) {
      safeToast('error', `Failed to delete ${numSelected} selected media file${numSelected > 1 ? 's' : ''}.`);
    }
  } else if (selectedFileId) {
    const fileToDelete = rows.find((row) => row.id === selectedFileId);
    const fileName = fileToDelete?.title || fileToDelete?.metadata?.fileName || 'this media file';
    const success = await onDeleteMedia(selectedFileId);
    if (success) {
      successfullyDeletedIds = [selectedFileId];
      safeToast('success', `Media file '${fileName}' deleted successfully.`);
      setSelectedFileId(null);
    } else {
      safeToast('error', `Failed to delete media file '${fileName}'.`);
    }
  }

  setSelected((currentSelected) => currentSelected.filter((id) => !successfullyDeletedIds.includes(id as string)));
  setIsModalOpen(false);
  setIsToolbarDelete(false);
}


