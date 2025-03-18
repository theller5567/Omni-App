import React from 'react';
interface ConfirmationModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}
declare const ConfirmationModal: React.FC<ConfirmationModalProps>;
export default ConfirmationModal;
