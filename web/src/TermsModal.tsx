import React from "react";
import styles from "./RegisterForm.module.css";

interface TermsModalProps {
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => (
  <div className={styles.termsModalOverlay}>
    <div className={styles.termsModal}>
      <h3>Terms & Conditions</h3>
      <ul>
        <li>By registering, you agree to our platform's terms and privacy policy.</li>
        <li>Payments and transactions are handled securely via Orange Money or approved methods.</li>
        <li>All users must provide accurate information.</li>
      </ul>
      <button onClick={onClose}>Close</button>
    </div>
  </div>
);

export default TermsModal;
export {}
