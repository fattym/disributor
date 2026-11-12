import {useShop} from "../store/useShop.js";
export default function Toast(){const t=useShop(s=>s.toast);return t?<div className="toast" role="status">{t}</div>:null}
