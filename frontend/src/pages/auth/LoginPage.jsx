import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Users, AlertTriangle, Megaphone, Activity } from 'lucide-react';
import { isValidEmail } from '../../lib/masks';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const { signIn } = useAuthStore();
  const navigate = useNavigate();

  const emailError = emailTouched && email && !isValidEmail(email);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValidEmail(email)) { setEmailTouched(true); return; }
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Coluna esquerda — formulário */}
      <div className="flex w-full flex-col items-center justify-center px-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-6 card p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-zellu-700">Zellu</h1>
            <p className="mt-1 text-sm text-gray-500">CRM para Farmácias</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Email</label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-1 ${emailError ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-zellu-500 focus:ring-zellu-500'}`}
              />
              {emailError && <p className="mt-1 text-xs text-red-500">Email inválido</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-zellu-500 focus:outline-none focus:ring-1 focus:ring-zellu-500"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="flex h-10 w-full items-center justify-center rounded-lg bg-zellu-600 text-sm font-medium text-white hover:bg-zellu-700 disabled:opacity-50">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500">Não tem conta? <Link to="/signup" className="font-medium text-zellu-600 hover:underline">Cadastre sua farmácia</Link></p>
        </div>
      </div>

      {/* Coluna direita — benefícios (só desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-zellu-800 px-12 text-white">
        <div className="max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">O CRM que sua farmácia precisa</h2>
            <p className="text-zellu-300 text-sm">Pare de perder clientes sem saber. O Zellu monitora, alerta e age por você.</p>
          </div>
          <div className="space-y-5">
            {[
              { icon: Users, title: 'Base de clientes organizada', desc: 'Todos os seus contatos do WhatsApp, classificados automaticamente' },
              { icon: AlertTriangle, title: 'Alertas de clientes em risco', desc: 'Saiba antes de perder — o Radar avisa quem está sumindo' },
              { icon: Megaphone, title: 'Campanhas com 1 clique', desc: 'A IA sugere, você aprova. Simples assim.' },
              { icon: Activity, title: 'Pulse da sua farmácia', desc: 'Saúde do negócio em tempo real, sem planilha' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zellu-700">
                  <Icon size={16} className="text-zellu-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-zellu-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-xl bg-zellu-700/50 p-4">
            <p className="text-sm text-zellu-200 italic">"Recuperei R$12.400 em clientes inativos no primeiro mês."</p>
            <p className="mt-2 text-xs text-zellu-400">— Dono de farmácia independente, Natal/RN</p>
          </div>
        </div>
      </div>
    </div>
  );
}
