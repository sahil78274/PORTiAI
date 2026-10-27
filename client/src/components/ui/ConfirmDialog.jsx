import { AlertTriangle } from 'lucide-react';
import Modal from './Modal.jsx';
import { Button } from './Primitives.jsx';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy = false,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3.5 items-start">
        {tone === 'danger' ? (
          <span className="icon-tile h-10 w-10 !text-danger">
            <AlertTriangle size={18} aria-hidden="true" />
          </span>
        ) : null}
        <div className="space-y-2 text-sm leading-relaxed text-inkSoft">
          <p>{description}</p>
          {children}
        </div>
      </div>
    </Modal>
  );
}
