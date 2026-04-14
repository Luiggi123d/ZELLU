import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Building2, Bell, CreditCard, Save, CheckCircle } from 'lucide-react';
import { maskCNPJ, maskPhone } from '../../lib/masks';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { showToast } from '../../components/ui/Toast';

export default function SettingsPage() {
  const { profile } = useAuthStore();
  const pharmacyId = profile?.pharmacy_id;

  const [loading, setLoading] = useState(true);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [pharmacy, setPharmacy] = useState({
    name: '', cnpj: '', phone: '', address: '', email: '',
  });
  const [notifications, setNotifications] = useState({
    clientLost: true, newClient: true, campaignReady: true, weeklyReport: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const p = profile.pharmacies || {};
    setPharmacy({
      name: p.name || '',
      cnpj: p.cnpj || '',
      phone: p.phone || '',
      address: p.address || '',
      email: p.email || '',
    });
    setLoading(false);
  }, [profile]);

  function updatePharmacy(field) {
    return (e) => {
      let val = e.target.value;
      if (field === 'cnpj') val = maskCNPJ(val);
      if (field === 'phone') val = maskPhone(val);
      setPharmacy((p) => ({ ...p, [field]: val }));
    };
  }

  async function handleSave() {
    if (!pharmacyId) return;
    setSaving(true);
    const { error } = await supabase
      .from('pharmacies')
      .update({
        name: pharmacy.name,
        cnpj: pharmacy.cnpj,
        phone: pharmacy.phone,
        address: pharmacy.address,
        email: pharmacy.email,
      })
      .eq('id', pharmacyId);
    setSaving(false);
    if (error) {
      showToast(`Erro ao salvar: ${error.message}`);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleNotif(key) {
    setNotifications((p) => ({ ...p, [key]: !p[key] }));
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl space-y-6">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} lines={4} />)}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500">Gerencie sua farmácia, conexões e preferências</p>
      </div>

      {/* WhatsApp */}
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            {whatsappConnected ? <Wifi size={22} className="text-green-600" /> : <WifiOff size={22} className="text-red-500" />}
          </div>
          <div className="flex-1">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Wifi size={18} />Conexão WhatsApp
            </h2>
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${whatsappConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className={`text-sm font-medium ${whatsappConnected ? 'text-emerald-600' : 'text-red-600'}`}>
                {whatsappConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
          {!whatsappConnected ? (
            <button onClick={() => setShowQR(true)} className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white hover:bg-emerald-700">
              <Wifi size={16} />Conectar WhatsApp
            </button>
          ) : (
            <button onClick={() => { setWhatsappConnected(false); setShowQR(false); }} className="flex h-10 items-center gap-2 rounded-lg border border-red-300 px-5 text-sm font-medium text-red-600 hover:bg-red-50">
              <WifiOff size={16} />Desconectar
            </button>
          )}
        </div>
        {showQR && !whatsappConnected && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
            <div className="flex gap-8">
              <div className="flex h-48 w-48 flex-shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white">
                <div className="text-center">
                  <Wifi size={32} className="mx-auto text-gray-300" />
                  <p className="mt-2 text-xs text-gray-400">QR Code aparecerá aqui</p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Como conectar:</h3>
                <div className="space-y-3">
                  {['Abra o WhatsApp no seu celular', 'Toque nos três pontinhos > Aparelhos conectados', 'Aponte a câmera para o QR Code'].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-zellu-600 text-xs font-bold text-white">{i + 1}</span>
                      <p className="text-sm text-gray-600">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pharmacy Data */}
      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Building2 size={18} />Dados da Farmácia
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'name', label: 'Nome da farmácia' },
            { key: 'cnpj', label: 'CNPJ' },
            { key: 'phone', label: 'Telefone' },
            { key: 'email', label: 'Email' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
              <input
                type="text"
                value={pharmacy[key] || ''}
                onChange={updatePharmacy(key)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-zellu-500 focus:outline-none focus:ring-1 focus:ring-zellu-500"
              />
            </div>
          ))}
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">Endereço</label>
            <input
              type="text"
              value={pharmacy.address || ''}
              onChange={updatePharmacy('address')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-zellu-500 focus:outline-none focus:ring-1 focus:ring-zellu-500"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex h-10 items-center gap-2 rounded-lg bg-zellu-600 px-5 text-sm font-medium text-white hover:bg-zellu-700 disabled:opacity-50"
          >
            <Save size={14} />{saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-600">
              <CheckCircle size={14} />Salvo!
            </span>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Bell size={18} />Notificações
        </h2>
        <div className="space-y-4">
          {[
            { key: 'clientLost', label: 'Alerta de cliente sumindo', desc: 'Aviso quando cliente de uso contínuo não compra há mais de 20 dias' },
            { key: 'newClient', label: 'Novo cliente identificado', desc: 'Aviso quando novo contato envia mensagem pela primeira vez' },
            { key: 'campaignReady', label: 'Campanha pronta para aprovação', desc: 'Quando a IA sugerir uma nova campanha' },
            { key: 'weeklyReport', label: 'Relatório semanal', desc: 'Resumo com métricas toda segunda-feira' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <button onClick={() => toggleNotif(key)} className={`relative h-6 w-11 rounded-full transition-colors ${notifications[key] ? 'bg-zellu-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notifications[key] ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Plan */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between bg-zellu-700 p-6 text-white">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><CreditCard size={18} />Plano atual</h2>
            <p className="mt-1 text-zellu-200">Trial — 14 dias restantes</p>
            <p className="mt-2 text-sm text-zellu-300">Acesso completo a todas as funcionalidades.</p>
          </div>
          <button className="flex h-10 items-center rounded-lg bg-white px-6 text-sm font-bold text-zellu-700 hover:bg-zellu-50">Fazer upgrade</button>
        </div>
      </div>
    </div>
  );
}
