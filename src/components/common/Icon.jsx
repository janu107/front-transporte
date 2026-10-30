import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import PeopleOutline from '@mui/icons-material/PeopleOutlineOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import LinkOutlined from '@mui/icons-material/LinkOutlined';
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined';
import SellOutlined from '@mui/icons-material/SellOutlined';
import CurrencyExchangeOutlined from '@mui/icons-material/CurrencyExchangeOutlined';
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import LocalGasStationOutlined from '@mui/icons-material/LocalGasStationOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';
import CalculateOutlined from '@mui/icons-material/CalculateOutlined';
import UndoOutlined from '@mui/icons-material/UndoOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
import FolderOutlined from '@mui/icons-material/FolderOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import PrintOutlined from '@mui/icons-material/PrintOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutlineOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import KeyOutlined from '@mui/icons-material/KeyOutlined';
import InboxOutlined from '@mui/icons-material/InboxOutlined';
import BoltOutlined from '@mui/icons-material/BoltOutlined';
import ScaleOutlined from '@mui/icons-material/ScaleOutlined';
import MenuOutlined from '@mui/icons-material/MenuOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';

// Imports individuales: Vite incluye únicamente los iconos utilizados.
const ICONS = {
  dashboard: DashboardOutlined, people: PeopleOutline, shield: ShieldOutlined,
  link: LinkOutlined, truck: LocalShippingOutlined, tag: SellOutlined,
  exchange: CurrencyExchangeOutlined, location: LocationOnOutlined,
  inventory: Inventory2Outlined, fuel: LocalGasStationOutlined, payments: PaymentsOutlined,
  business: BusinessOutlined, settings: SettingsOutlined, badge: BadgeOutlined,
  document: DescriptionOutlined, receipt: ReceiptLongOutlined,
  wallet: AccountBalanceWalletOutlined, calculate: CalculateOutlined, undo: UndoOutlined,
  history: HistoryOutlined, warning: WarningAmberOutlined, report: AssessmentOutlined,
  folder: FolderOutlined, schedule: ScheduleOutlined, print: PrintOutlined,
  refresh: RefreshOutlined, check: CheckCircleOutline, search: SearchOutlined,
  save: SaveOutlined, add: AddOutlined, edit: EditOutlined, delete: DeleteOutline,
  block: BlockOutlined, view: VisibilityOutlined, key: KeyOutlined, inbox: InboxOutlined,
  bolt: BoltOutlined, scale: ScaleOutlined, menu: MenuOutlined, close: CloseOutlined,
  logout: LogoutOutlined, expand: ExpandMoreOutlined, chevron: ChevronRightOutlined,
  arrow: ArrowForwardOutlined,
};

/** Icono decorativo; el control que lo contiene aporta su etiqueta accesible. */
export default function Icon({ name, size = 20, className = '', ...props }) {
  const Component = ICONS[name] || DescriptionOutlined;
  return <Component className={`app-icon ${className}`} sx={{ fontSize: size }} aria-hidden="true" {...props} />;
}
