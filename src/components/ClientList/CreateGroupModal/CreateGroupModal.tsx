import { Plus } from "lucide-react";
import { useState } from "react";
import { useCreateGroupMutation } from "../../../store/slice/groupsSlice/groupsSlice";
import { NewClientEntry } from "../AddToGroupModal/AddToGroupModal";


interface CreateGroupModalProps {
  allClientCodes: string[];
  masterCode: string;
  onClose: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ allClientCodes, masterCode, onClose }) => {
  const [createGroup, { isLoading }] = useCreateGroupMutation();
  const [groupName, setGroupName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [newCode, setNewCode]= useState('');
  const [newName, setNewName]= useState('');
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
    if (allClientCodes.includes(code) || extraClients.find(c => c.client_code === code)) return;
    setExtraClients(prev => [...prev, { client_code: code, client_name: newName.trim() || code }]);
    setNewCode('');
    setNewName('');
  };

  const handleCreate = async () => {
    if (!groupName.trim()) { setError('Group name is required'); return; }
    try {
      const allCodes = [...Array.from(selected), ...extraClients.map(c => c.client_code)];
      await createGroup({
        group_name:    groupName.trim(),
        created_by:    masterCode,
        client_codes:  allCodes,
        extra_clients: extraClients,
      } as any).unwrap();
      onClose();
    } catch (e: any) {
      setError(e?.data?.message ?? 'Failed to create group');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal--group">
        <h3 className="modal__title">Create New Group</h3>

        <label className="modal__label">Group Name</label>
        <input
          className="modal__input"
          placeholder="e.g. GroupA"
          value={groupName}
          onChange={e => { setGroupName(e.target.value); setError(''); }}
        />

        {allClientCodes.length > 0 && (
          <>
            <label className="modal__label" style={{ marginTop: 16 }}>
              Existing Clients <span className="modal__hint">({selected.size} selected)</span>
            </label>
            <div className="modal__client-list">
              {allClientCodes.map(code => (
                <label key={code} className="modal__client-row">
                  <input type="checkbox" checked={selected.has(code)} onChange={() => toggle(code)} />
                  <span>{code}</span>
                </label>
              ))}
            </div>
          </>
        )}

        <label className="modal__label" style={{ marginTop: 12 }}>
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

        {error && <p className="modal__error">{error}</p>}

        <div className="modal__actions">
          <button className="cm__btn cm__btn--outline" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button className="cm__btn cm__btn--primary" onClick={handleCreate} disabled={isLoading}>
            {isLoading ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
};
