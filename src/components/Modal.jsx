import { colors } from '../constants';

const backdropStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  zIndex: 1000,
};

const cardStyle = {
  backgroundColor: colors.card,
  borderRadius: 12,
  padding: 20,
  width: '100%',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  maxHeight: '90vh',
  overflowY: 'auto',
};

export default function Modal({ open, onClose, children, width = 380 }) {
  if (!open) return null;
  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={{ ...cardStyle, maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
