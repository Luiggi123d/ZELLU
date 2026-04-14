import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Building2, Bell, CreditCard, Save, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { maskCNPJ, maskPhone } from '../../lib/masks';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useWhatsappStore } from '../../store/whatsappStore';
import { api } from '../../lib/api';
import { formatPhoneFromDigits } from '../../lib/dataHelpers';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { showToast } from '../../components/ui/Toast';

export default function SettingsPage() {
  const { profile } = useAuthStore();
  const pharmacyId = profile?.pharmacy_id;

  const connected = useWhatsappStore((s) => s.connected);
  const phone = useWhatsappStore((s) => s.phone);
  const state = useWhatsappStore((s) => s.state);
  const fetchStatus = useWhatsappStore((s) => s.fetchStatus);
  const setStatus = useWhatsappStore((s) => s.setStatus);
  const startPolling = useWhatsappStore((s) => s.startPolling);
  const stopPolling = useWhatsappStore((s) => s.stopPolling);
  const resetWa = useWhatsappStore((s) => s.reset);

  const [loading, setLoading] = useState(true);
  const [waQrcode, setWaQrcode] = useState(null);
  const [waConnecting, setWaConnecting] = useState(false);
  const [waError, setWaError] = useState(null);
  const [syncing, setSyncing] = useState(false);

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

  useEffect(() => {
    if (!pharmacyId) return;
    fetchStatus(true);
  }, [pharmacyId, fetchStatus]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  async function handleConnectWhatsApp() {
    setWaConnecting(true);
    setWaError(null);
    setWaQrcode(null);
    try {
      const data = await api.post('/whatsapp/connect', {});
      if (!data.qrcode) {
        throw new Error('QR Code não retornado pela Evolution API');
      }
      setWaQrcode(data.qrcode);
      startPolling(async (connectedData) => {
        setStatus({
          connected: true,
          phone: connectedData.phone,
          state: connectedData.state || 'open',
        });
        setWaQrcode(null);
        showToast(`WhatsApp conectado${connectedData.phone ? ` (${formatPhoneFromDigits(connectedData.phone)})` : ''}!`);
        // Kick off history sync so the CRM has data immediately
        try {
          await api.post('/whatsapp/sync-history', {});
          showToast('Histórico sincronizado!');
        } catch (_) { /* backend webhook already triggers it; ignore */ }
      });
    } catch (err) {
      setWaError(err.message || 'Erro ao conectar WhatsApp');
    } finally {
      setWaConnecting(false);
    }
  }

  async function handleRefreshQr() {
    setWaConnecting(true);
    setWaError(null);
    try {
      const data = await api.post('/whatsapp/connect', {});
      if (data.qrcode) setWaQrcode(data.qrcode);
    } catch (err) {
      setWaError(err.message || 'Erro ao gerar novo QR');
    } finally {
      setWaConnecting(false);
    }
  }

  async function handleSyncHistory() {
    setSyncing(true);
    try {
      const r = await api.post('/whatsapp/sync-history', {});
      showToast(`Histórico sincronizado: ${r.contactsUpserted || 0} contatos, ${r.messagesInserted || 0} mensagens`);
    } catch (err) {
      showToast(`Erro ao sincronizar: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnectWhatsApp() {
    setWaConnecting(true);
    setWaError(null);
    try {
      await api.delete('/whatsapp/disconnect');
      setWaQrcode(null);
      resetWa();
      showToast('WhatsApp desconectado.');
    } catch (err) {
      setWaError(err.message || 'Erro ao desconectar');
    } finally {
      setWaConnecting(false);
    }
  }

  const qrSrc = waQrcode
    ? waQrcode.startsWith('data:') ? waQrcode : `data:image/png;base64,${waQrcode}`
    : null;

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
            {connected ? <Wifi size={22} className="text-green-600" /> : <WifiOff size={22} className="text-red-500" />}
          </div>
          <div className="flex-1">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Wifi size={18} />Conexão WhatsApp
            </h2>
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-emerald-500' : state === 'connecting' ? 'bg-amber-500' : 'bg-red-500'}`} />
              <span className={`text-sm font-medium ${connected ? 'text-emerald-600' : state === 'connecting' ? 'text-amber-600' : 'text-red-600'}`}>
                {connected
                  ? <>Conectado{phone ? ` — ${formatPhoneFromDigits(phone)}` : ''}</>
                  : state === 'connecting' ? 'Conectando...' : 'Desconectado'}
              </span>
            </div>
          </div>
          {!connected ? (
            <button
              onClick={handleConnectWhatsApp}
              disabled={waConnecting}
              className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {waConnecting ? <Loader2 size={16} className="animate-spin" /> : <Wifi size={16} />}
              {waConnecting ? 'Gerando QR...' : 'Conectar WhatsApp'}
            </button>
          ) : (
            <button
              onClick={handleDisconnectWhatsApp}
              disabled={waConnecting}
              className="flex h-10 items-center gap-2 rounded-lg border border-red-300 px-5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {waConnecting ? <Loader2 size={16} className="animate-spin" /> : <WifiOff size={16} />}
              Desconectar
            </button>
          )}
        </div>

        {waError && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {waError}
          </div>
        )}

        {connected && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Sincronizar histórico</p>
              <p className="text-xs text-gray-500">Importa contatos e mensagens recentes da Evolution API para o Zellu.</p>
            </div>
            <button
              onClick={handleSyncHistory}
              disabled={syncing}
              className="flex h-9 items-center gap-2 rounded-lg border border-zellu-300 bg-white px-4 text-xs font-medium text-zellu-700 hover:bg-zellu-50 disabled:opacity-50"
            >
              {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {syncing ? 'Sincronizando...' : 'Sincronizar agora'}
            </button>
          </div>
        )}

        {qrSrc && !connected && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
            <div className="flex gap-8">
              <div className="flex h-56 w-56 flex-shrink-0 items-center justify-center rounded-xl border-2 border-gray-200 bg-white p-2">
                <img src={qrSrc} alt="QR Code WhatsApp" className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-1 flex-col">
                <h3 className="font-semibold text-gray-900">Como conectar:</h3>
                <div className="mt-4 space-y-3">
                  {['Abra o WhatsApp no seu celular', 'Toque nos três pontinhos > Aparelhos conectados', 'Toque em "Conectar um aparelho"', 'Aponte a câmera para o QR Code ao lado'].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-zellu-600 text-xs font-bold text-white">{i + 1}</span>
                      <p className="text-sm text-gray-600">{text}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <p className="flex items-center gap-1.5 text-xs text-amber-600">
                    <Loader2 size={12} className="animate-spin" />
                    Aguardando leitura do QR...
                  </p>
                  <button
                    onClick={handleRefreshQr}
                    disabled={waConnecting}
                    className="flex items-center gap-1 text-xs text-zellu-600 hover:underline disabled:opacity-50"
                  >
                    <RefreshCw size={12} />Gerar novo QR
                  </button>
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
