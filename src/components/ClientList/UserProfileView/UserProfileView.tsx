import { useAppSelector } from "../../../store/hooks";


export const UserProfileView: React.FC = () => {
  const { user }               = useAppSelector(s => s.auth);
  const { data: clients }      = useAppSelector(s => s.clients);
  const clientsList             = Object.values(clients);
  const myClient                = clientsList.find(c => c.client_code === user?.clientCode) ?? clientsList[0];

  if (!myClient) return <div className="cm__empty"><p>No account data found.</p></div>;

  const isActive        = myClient.is_active;
  const isAuthenticated = myClient.is_authenticated;
  const investedBalance = (myClient as any).invested_balance ?? (myClient as any).balance ?? 0;
  const displayName     = user?.name ?? myClient.client_code;
  const avatarLetter    = displayName[0]?.toUpperCase() ?? 'U';

  return (
    <div className="cm__profile">
      <div className="cm__profile-hero">
        <div className="cm__profile-avatar">{avatarLetter}</div>
        <div className="cm__profile-identity">
          <h3 className="cm__profile-name">{displayName}</h3>
          <span className={`cm__profile-pill cm__profile-pill--${isActive ? 'active' : 'inactive'}`}>
            <span className="cm__profile-dot" />
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <div className="cm__profile-cards">
        <div className="cm__profile-card">
          <span className="cm__profile-card-label">Client Code</span>
          <span className="cm__profile-card-value cm__profile-card-value--mono">{myClient.client_code}</span>
        </div>
        <div className="cm__profile-card">
          <span className="cm__profile-card-label">Account Status</span>
          <span className={`cm__profile-card-value ${isActive ? 'cm__profile-card-value--green' : 'cm__profile-card-value--red'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="cm__profile-card">
          <span className="cm__profile-card-label">Authentication</span>
          <span className={`cm__profile-card-value ${isAuthenticated ? 'cm__profile-card-value--green' : 'cm__profile-card-value--red'}`}>
            {isAuthenticated ? 'Authenticated' : 'Pending'}
          </span>
        </div>
        <div className="cm__profile-card cm__profile-card--balance">
          <span className="cm__profile-card-label">Invested Balance</span>
          <span className="cm__profile-card-value cm__profile-card-value--balance">
            ₹{Number(investedBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};
