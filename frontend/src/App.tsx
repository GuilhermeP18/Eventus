import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Cadastro } from './pages/Cadastro';
import { MeusIngressos } from './pages/MeusIngressos';
import { Painel } from './pages/Painel';
import { Portaria } from './pages/Portaria';
import { NaoEncontrada } from './pages/NaoEncontrada';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/meus-ingressos" element={<MeusIngressos />} />
              <Route path="/painel" element={<Painel />} />
              <Route path="/portaria" element={<Portaria />} />
            </Route>
            <Route path="*" element={<NaoEncontrada />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
