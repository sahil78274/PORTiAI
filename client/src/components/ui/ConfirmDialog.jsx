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
      <div className="flex gap-3">
        {tone === 'danger' ? (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dangerSoft text-danger">
            <AlertTriangle size={16} aria-hidden="true" />
          </span>
        ) : null}
        <p className="text-sm leading-6 text-inkSoft">{description}</p>
      </div>
      {children}
    </Modal>
  );
}
