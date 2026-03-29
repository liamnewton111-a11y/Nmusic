import React from 'react';

export default function Modal({ title, children, onClose, width }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={width ? { maxWidth: width } : {}}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
