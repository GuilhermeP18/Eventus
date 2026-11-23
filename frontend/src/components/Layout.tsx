import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  // a Home tem uma faixa de destaque de largura total e cuida do próprio container
  const { pathname } = useLocation();
  const fullWidth = pathname === '/';

  return (
    <>
      <Navbar />
      <main className={fullWidth ? '' : 'container py-4 py-md-5'}>
        <Outlet />
      </main>
    </>
  );
}
