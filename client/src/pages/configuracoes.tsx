
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";

const defaultSettings = {
  company_name: "",
  company_cnpj: "",
  company_email: "",
  password_policy: "8",
  token_expiration: 30,
  training_frequency: "Mensal",
  alert_days: 7,
};

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/settings", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : defaultSettings)
      .then(data => {
        setSettings({ ...defaultSettings, ...data });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback("");
    const payload = {
      ...settings,
      token_expiration: Number(settings.token_expiration),
      alert_days: Number(settings.alert_days),
    };
    const token = localStorage.getItem("token");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setFeedback("Configurações salvas com sucesso!");
    } else {
      setFeedback("Erro ao salvar configurações.");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-4">Carregando...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 max-w-xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Informações da Empresa */}
              <section>
                <h2 className="text-lg font-semibold mb-2">Informações da Empresa</h2>
                <div className="space-y-2">
                  <label className="block">
                    Nome da empresa
                    <input name="company_name" value={settings.company_name} onChange={handleChange} type="text" className="input w-full" placeholder="Digite o nome" />
                  </label>
                  <label className="block">
                    CNPJ
                    <input name="company_cnpj" value={settings.company_cnpj} onChange={handleChange} type="text" className="input w-full" placeholder="00.000.000/0000-00" />
                  </label>
                  <label className="block">
                    E-mail administrativo
                    <input name="company_email" value={settings.company_email} onChange={handleChange} type="email" className="input w-full" placeholder="email@empresa.com" />
                  </label>
                </div>
              </section>

              {/* Segurança */}
              <section>
                <h2 className="text-lg font-semibold mb-2">Segurança</h2>
                <div className="space-y-2">
                  <label className="block">
                    Políticas de senha
                    <select name="password_policy" value={settings.password_policy} onChange={handleChange} className="input w-full">
                      <option value="8">Mínimo 8 caracteres</option>
                      <option value="10">Mínimo 10 caracteres</option>
                      <option value="12">Mínimo 12 caracteres</option>
                    </select>
                  </label>
                  <label className="block">
                    Tempo de expiração do token de sessão
                    <select name="token_expiration" value={settings.token_expiration} onChange={handleChange} className="input w-full">
                      <option value="30">30 minutos</option>
                      <option value="60">1 hora</option>
                      <option value="120">2 horas</option>
                    </select>
                  </label>
                </div>
              </section>

              {/* SST Específicas */}
              <section>
                <h2 className="text-lg font-semibold mb-2">SST Específicas</h2>
                <div className="space-y-2">
                  <label className="block">
                    Frequência de treinamentos obrigatórios
                    <select name="training_frequency" value={settings.training_frequency} onChange={handleChange} className="input w-full">
                      <option value="Mensal">Mensal</option>
                      <option value="Trimestral">Trimestral</option>
                      <option value="Semestral">Semestral</option>
                      <option value="Anual">Anual</option>
                    </select>
                  </label>
                  <label className="block">
                    Configuração de alertas para vencimento de documentos
                    <select name="alert_days" value={settings.alert_days} onChange={handleChange} className="input w-full">
                      <option value="7">7 dias antes</option>
                      <option value="15">15 dias antes</option>
                      <option value="30">30 dias antes</option>
                    </select>
                  </label>
                </div>
              </section>

              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar Configurações"}
              </Button>
              {feedback && <div className="mt-2 text-sm text-green-600">{feedback}</div>}
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
