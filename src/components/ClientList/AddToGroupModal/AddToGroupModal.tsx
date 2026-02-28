import { Plus } from "lucide-react";
import { useState } from "react";
import { useAddClientsToGroupMutation } from "../../../store/slice/groupsSlice/groupsSlice";

interface AddToGroupModalProps {
  groupName: string;
  existingCodes: string[];
  allClientCodes: string[];
  onClose: () => void;
}
export interface NewClientEntry {
  client_code: string;
  client_name: string;
}


export const AddToGroupModal: React.FC<AddToGroupModalProps> = ({
  groupName, existingCodes, allClientCodes, onClose,
}) => {
  const [addClients, { isLoading }]     = useAddClientsToGroupMutation();
  const available                       = allClientCodes.filter(c => !existingCodes.includes(c));
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [newCode, setNewCode]           = useState('');
  const [newName, setNewName]           = useState('');
  const [extraClients, setExtraClients] = useState<NewClientEntry[]>([]);

  const toggle = (code: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });

  const handleAddNewClient = () => {
    const code = newCode.trim();
    if (!code) return;
    if (
      existingCodes.includes(code) ||
      allClientCodes.includes(code) ||
      extraClients.find(c => c.client_code === code)
    ) return;
    setExtraClients(prev => [...prev, { client_code: code, client_name: newName.trim() || code }]);
    setNewCode('');
    setNewName('');
  };

  const handleAdd = async () => {
    const allCodes = [...Array.from(selected), ...extraClients.map(c => c.client_code)];
    if (allCodes.length === 0) return;
    await addClients({ groupName, client_codes: allCodes, extra_clients: extraClients } as any);
    onClose();
  };

  const totalSelected = selected.size + extraClients.length;

  return (
    <div className="modal-overlay">
      <div className="modal modal--group">
        <h3 className="modal__title">Add Clients to "{groupName}"</h3>

        {available.length > 0 && (
          <>
            <label className="modal__label">Existing Clients</label>
            <div className="modal__client-list">
              {available.map(code => (
                <label key={code} className="modal__client-row">
                  <input type="checkbox" checked={selected.has(code)} onChange={() => toggle(code)} />
                  <span>{code}</span>
                </label>
              ))}
            </div>
          </>
        )}

        <label className="modal__label" style={{ marginTop: available.length > 0 ? 12 : 0 }}>
          Add New Client <span className="modal__hint">(not yet registered)</span>
        </label>
        <div className="modal__new-client-row">
          <input
            className="modal__input modal__input--sm"
            placeholder="Client Code"
            value={newCode}
            onChange={e => setNewCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddNewClient()}
          />
          <input
            className="modal__input modal__input--sm"
            placeholder="Name (optional)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddNewClient()}
          />
          <button
            className="cm__btn cm__btn--outline cm__btn--icon"
            onClick={handleAddNewClient}
            disabled={!newCode.trim()}
          >
            <Plus size={14} />
          </button>
        </div>

        {extraClients.length > 0 && (
          <div className="modal__extra-list">
            {extraClients.map(c => (
              <div key={c.client_code} className="modal__extra-tag">
                <span>{c.client_code}</span>
                <button
                  className="modal__extra-remove"
                  onClick={() => setExtraClients(prev => prev.filter(x => x.client_code !== c.client_code))}
                >×</button>
              </div>
            ))}
          </div>
        )}

        <div className="modal__actions">
          <button className="cm__btn cm__btn--outline" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button
            className="cm__btn cm__btn--primary"
            onClick={handleAdd}
            disabled={isLoading || totalSelected === 0}
          >
            {isLoading ? 'Adding…' : `Add (${totalSelected})`}
          </button>
        </div>
      </div>
    </div>
  );
};
