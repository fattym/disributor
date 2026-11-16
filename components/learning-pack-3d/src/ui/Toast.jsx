import { useShop } from "../store/useShop.js";

export default function Toast() {
  const t = useShop((s) => s.toast);
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {t && <div className="toast">{t}</div>}
    </div>
  );
}
