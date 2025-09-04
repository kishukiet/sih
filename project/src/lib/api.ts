import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  role: 'OPERATOR' | 'SUPERVISOR' | 'ENGINEER';
}

export interface Transformer {
  _id: string;
  name: string;
  geo: {
    lat: number;
    lng: number;
  };
  feederId: string;
  hasLTSwitch: boolean;
  status: 'ONLINE' | 'OFFLINE' | 'FAULT';
}

export interface Case {
  _id: string;
  startTs: string;
  transformerId: Transformer;
  candidateEdgeId: string;
  confidence: number;
  affectedMeters: string[];
  plan: {
    kind: 'LT_SWITCH' | 'UPSTREAM' | 'METER_RING' | 'NOTIFY_ONLY';
    targets: string[];
  };
  state: 'NEW' | 'PLANNED' | 'EXECUTED' | 'CLOSED';
}

export interface Device {
  _id: string;
  type: 'LT_SW' | 'RMU' | 'BREAKER' | 'METER';
  name: string;
  status: 'OPEN' | 'CLOSED';
  capabilities: {
    open: boolean;
    close: boolean;
  };
}

export interface Event {
  _id: string;
  ts: string;
  type: 'LAST_GASP' | 'V_SAG' | 'PHASE_LOSS' | 'SCADA_TELEMETRY';
  payload: any;
}

// API methods
export const auth = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

export const cases = {
  getActive: () => api.get<Case[]>('/cases/active'),
  getById: (id: string) => api.get<Case>(`/cases/${id}`),
  approve: (id: string) => api.post(`/cases/${id}/approve`),
  block: (id: string, reason?: string) => api.post(`/cases/${id}/block`, { reason }),
  getAll: (page = 1, limit = 20) => 
    api.get(`/cases?page=${page}&limit=${limit}`),
};

export const devices = {
  getAll: (transformerId?: string) => {
    const params = transformerId ? `?transformerId=${transformerId}` : '';
    return api.get<Device[]>(`/devices${params}`);
  },
  open: (id: string) => api.post(`/devices/${id}/open`),
  close: (id: string) => api.post(`/devices/${id}/close`),
};

export const graph = {
  getTransformers: () => api.get<Transformer[]>('/graph/transformers'),
  seedDatabase: () => api.post('/graph/seed'),
};

export const events = {
  getRecent: (limit = 50) => api.get<Event[]>(`/events/recent?limit=${limit}`),
};