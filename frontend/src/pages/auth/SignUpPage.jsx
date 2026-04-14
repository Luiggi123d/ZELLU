import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, MessageSquare, Radar, Megaphone, Zap, ArrowRight, ArrowLeft } from 'lucide-react';
import { isValidEmail, maskPhone } from '../../lib/masks';
import { useAuthStore } from '../../store/authStore';

const benefits = [
  { icon: MessageSquare, title: 'CRM automático por WhatsApp', desc: 'Gerencie todos os contatos e conversas em um só lugar' },
  { icon: Radar, title: 'Radar de clientes em risco', desc: 'Saiba quem está sumindo antes de perdê-lo' },
  { icon: Megaphone, title: 'Campanhas com aprovação manual', desc: 'IA sugere, você decide quando enviar' },
  { icon: Zap, title: 'Configurado em 5 minutos', desc: 'Conecte seu WhatsApp e comece a usar' },
];

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', password: '', pharmacyName: '', pharmacyPhone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const { signUp } = useAuthStore();
  const navigate = useNavigate();

  const emailError = emailTouched && form.email && !isValidEmail(form.email);

  function update(field) {
    return (e) => {
      let val = e.target.value;
      if (field === 'pharmacyPhone') val = maskPhone(val);
      setForm((f) => ({ ...f, [field]: val }));
    };
  }

  function nextStep(e) {
    e.preventDefault();
    if (!isValidEmail(form.email)) { setEmailTouched(true); return; }
    if (form.password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres'); return; }
    setError('');
    setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp({ ...form, fullName: form.pharmacyName, pharmacyCnpj: '00.000.000/0001-00' });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-lg">
        {/* Left — Form */}
        <div className="w-1/2 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-zellu-700">Zellu</h1>
            <p className="mt-1 text-sm text-gray-500">Cadastre sua farmácia</p>
          </div>

          {/* Step indicator */}
          <div className="mb-6 flex gap-2">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-zellu-600' : 'bg-gray-200'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-zellu-600' : 'bg-gray-200'}`} />
          </div>

          {step === 1 ? (
            <form onSubmit={nextStep} className="space-y-4">
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
              <p className="text-sm font-medium text-gray-700">Etapa 1 de 2 — Sua conta</p>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Email</label>
                <input
                  type="email" required value={form.email} onChange={update('email')} onBlur={() => setEmailTouched(true)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-1 ${emailError ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-zellu-500 focus:ring-zellu-500'}`}
                />
                {emailError && <p className="mt-1 text-xs text-red-500">Email inválido</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} required value={form.password} onChange={update('password')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-zellu-500 focus:outline-none focus:ring-1 focus:ring-zellu-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zellu-600 text-sm font-medium text-white hover:bg-zellu-700">
                Continuar <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
              <p className="text-sm font-medium text-gray-700">Etapa 2 de 2 — Sua farmácia</p>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Nome da farmácia</label>
                <input type="text" required value={form.pharmacyName} onChange={update('pharmacyName')} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-zellu-500 focus:outline-none focus:ring-1 focus:ring-zellu-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Telefone da farmácia</label>
                <input type="tel" required value={form.pharmacyPhone} onChange={update('pharmacyPhone')} placeholder="(11) 99999-9999" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-zellu-500 focus:outline-none focus:ring-1 focus:ring-zellu-500" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(1)} className="flex h-10 items-center gap-1 rounded-lg border border-gray-300 px-4 text-sm text-gray-600 hover:bg-gray-50"><ArrowLeft size={16} />Voltar</button>
                <button type="submit" disabled={loading} className="flex h-10 flex-1 items-center justify-center rounded-lg bg-zellu-600 text-sm font-medium text-white hover:bg-zellu-700 disabled:opacity-50">
                  {loading ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">Já tem conta? <Link to="/login" className="font-medium text-zellu-600 hover:underline">Entrar</Link></p>
        </div>

        {/* Right — Benefits */}
        <div className="flex w-1/2 flex-col justify-center bg-zellu-700 p-8 text-white">
          <h2 className="text-xl font-bold">O que você ganha com o Zellu</h2>
          <div className="mt-6 space-y-5">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon size={20} className="text-zellu-200" />
                </div>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-zellu-300">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
