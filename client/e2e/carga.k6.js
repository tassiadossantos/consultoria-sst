import http from 'k6/http';
import { sleep, check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 }, // 20 usuários simultâneos
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const res = http.get('http://localhost:5000/api/companies');
  check(res, {
    'status é 200': (r) => r.status === 200,
    'resposta contém empresas': (r) => r.json().length >= 0,
  });
  sleep(1);
}
