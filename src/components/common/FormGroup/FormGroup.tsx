import React from 'react';

interface FormGroupProps {
  label: string;
  children: React.ReactNode;
}

export const FormGroup: React.FC<FormGroupProps> = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#cbd5e1' }}>{label}</label>
    <div>
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && (child.type === 'input' || child.type === 'select')) {
          return React.cloneElement(child as React.ReactElement<any>, {style: { width: '100%',  padding: '0.75rem', background: '#0f172a', border: '1px solid #334155',borderRadius: '0.5rem',  color: '#e2e8f0',fontSize: '1rem',
            //   ...(child.props.style || {})
            }
          });
        }
        return child;
      })}
    </div>
  </div>
);