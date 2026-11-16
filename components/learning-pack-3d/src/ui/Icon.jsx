import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as I from "@fortawesome/free-solid-svg-icons";

const MAP = {
  "book-open": I.faBookOpen, book: I.faBook, pencil: I.faPencil, ruler: I.faRulerCombined, palette: I.faPalette,
  bag: I.faBagShopping, file: I.faFileLines, gift: I.faGift, cart: I.faCartShopping, search: I.faMagnifyingGlass,
  list: I.faClipboardList, locate: I.faLocationCrosshairs, route: I.faRoute, expand: I.faExpand, compress: I.faCompress,
  x: I.faXmark, trash: I.faTrashCan, user: I.faUser, check: I.faCheck, warn: I.faTriangleExclamation, pin: I.faLocationDot,
  minus: I.faMinus, plus: I.faPlus, store: I.faStore, left: I.faChevronLeft, truck: I.faTruck, star: I.faStar,
  info: I.faCircleInfo, stop: I.faStop, compass: I.faCompass, bars: I.faBars, right: I.faArrowRight, eye: I.faEye,
};

export default function Icon({ name, ...rest }) {
  return <FontAwesomeIcon icon={MAP[name]} fixedWidth {...rest} />;
}
