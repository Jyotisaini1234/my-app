import { AlertTriangle, XCircle } from "lucide-react";
import { Button } from "../../common/Button/Button";
import { TradeLogEntry } from "../../../types/type";

interface CancelModalProps {
  row: TradeLogEntry;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}

export const CancelModal: React.FC<CancelModalProps> = ({ row, onConfirm, onClose, loading }) => (
  <div className="cancel-modal">
    <div className="cancel-modal__backdrop" onClick={onClose} />
    <div className="cancel-modal__box">

      <div className="cancel-modal__icon">
        <AlertTriangle size={20} />
      </div>

      <p className="cancel-modal__title">Cancel this order?</p>

      <div className="cancel-modal__meta">
        <div className="cancel-modal__meta-row">
          <span>Client</span>
          <span>{row.clientCode || '—'}</span>
        </div>
        <div className="cancel-modal__meta-row">
          <span>Order ID</span>
          <span>{row.uniqueOrderId || '—'}</span>
        </div>
        <div className="cancel-modal__meta-row">
          <span>Status</span>
          <span>{row.status || '—'}</span>
        </div>
        {row.quantity && (
          <div className="cancel-modal__meta-row">
            <span>Qty</span>
            <span>{row.quantity}</span>
          </div>
        )}
      </div>

      <div className="cancel-modal__actions">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Go Back</Button>
        <Button variant="danger" size="sm" loading={loading} icon={<XCircle size={14} />} onClick={onConfirm} >  Yes, Cancel </Button>
      </div>

    </div>
  </div>
);
