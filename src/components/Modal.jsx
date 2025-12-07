import './Modal.css';

function Modal({ isOpen, onClose, title, children, hideHeader = false }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {!hideHeader && (
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        )}
        {hideHeader && (
          <button className="modal-close-float" onClick={onClose}>×</button>
        )}
        <div className={`modal-body ${hideHeader ? 'no-header' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
