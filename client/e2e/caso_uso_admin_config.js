// Simulação de caso de uso: admin configura plataforma
import http from 'k6/http';
import { check } from 'k6';

export default function () {
  // Login
  const loginRes = http.post('http://localhost:5000/api/auth/login', JSON.stringify({ username: 'admin', password: 'admin123' }), { headers: { 'Content-Type': 'application/json' } });
  check(loginRes, { 'login status 200': (r) => r.status === 200 });
  const token = loginRes.json('token');

  // Salvar configurações
  const settings = {
    company_name: 'Empresa K6',
    company_cnpj: '99.888.777/0001-66',
    company_email: 'admin@k6.com',
    password_policy: '12',
    token_expiration: 120,
    training_frequency: 'Anual',
    alert_days: 30,
  };
  const res = http.put('http://localhost:5000/api/settings', JSON.stringify(settings), { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
  check(res, { 'config status 200': (r) => r.status === 200 });
}
