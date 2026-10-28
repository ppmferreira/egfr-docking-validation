import styles from './Toast.module.css'

export const Toast = ({ message }: { message: string }) => (
  <div className={`${styles.toast} ${message ? styles.on : ''}`} role="status">{message && `Atualizado: ${message}`}</div>
)
