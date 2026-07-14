import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import RecordPage from './pages/RecordPage';
import HistoryPage from './pages/HistoryPage';
import ItemsPage from './pages/ItemsPage';
import SettingsPage from './pages/SettingsPage';
import { useIsMobile } from './hooks/useIsMobile';
import { useAutoSync } from './hooks/useAutoSync';
import { colors } from './constants';

const NAV_ITEMS = [
  { to: '/', label: 'บันทึกรายการ', icon: '📝', end: true },
  { to: '/history', label: 'ประวัติ', icon: '🧾' },
  { to: '/items', label: 'รายการด่วน', icon: '📋' },
  { to: '/settings', label: 'ตั้งค่า', icon: '⚙️' },
];

const styles = {
  appShell: (isMobile) => ({
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    minHeight: '100vh',
    backgroundColor: colors.bg,
  }),
  sidebar: {
    width: 220,
    flexShrink: 0,
    backgroundColor: colors.white,
    borderRight: `1px solid ${colors.border}`,
    padding: '24px 12px',
    position: 'sticky',
    top: 0,
    height: '100vh',
  },
  sidebarTitle: { fontSize: 18, fontWeight: 800, color: colors.text, padding: '0 12px 20px' },
  sidebarLink: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    borderRadius: 10,
    marginBottom: 6,
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 15,
    color: active ? colors.primary : colors.muted,
    backgroundColor: active ? '#eff6ff' : 'transparent',
  }),
  main: (isMobile) => ({
    flex: 1,
    paddingBottom: isMobile ? 76 : 0,
    minWidth: 0,
  }),
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    backgroundColor: colors.white,
    borderTop: `1px solid ${colors.border}`,
    boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
    zIndex: 900,
  },
  bottomLink: (active) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '10px 0 8px',
    textDecoration: 'none',
    fontSize: 11,
    fontWeight: 600,
    color: active ? colors.primary : colors.muted,
  }),
  bottomIcon: { fontSize: 20 },
};

function Navigation({ isMobile }) {
  if (isMobile) {
    return (
      <nav style={styles.bottomNav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => styles.bottomLink(isActive)}
          >
            <span style={styles.bottomIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    );
  }

  return (
    <aside style={styles.sidebar}>
      <div style={styles.sidebarTitle}>💰 ร้านค้า</div>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          style={({ isActive }) => styles.sidebarLink(isActive)}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </aside>
  );
}

function AppShell() {
  const isMobile = useIsMobile();
  useAutoSync();

  return (
    <div style={styles.appShell(isMobile)}>
      {!isMobile && <Navigation isMobile={false} />}
      <main style={styles.main(isMobile)}>
        <Routes>
          <Route path="/" element={<RecordPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      {isMobile && <Navigation isMobile={true} />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
