// API Client for MySQL Backend
export const API_URL = import.meta.env.VITE_API_URL || "";
 
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};
 
export const api = {
  auth: {
    login: async (credentials: any) => {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    },
    register: async (data: any) => {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Registration failed');
      return res.json();
    },
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    },
    getUser: () => {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
  },
 
  patients: {
    list: async () => {
      const res = await fetch(`${API_URL}/api/patients`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch patients');
      return res.json();
    },
    create: async (data: any) => {
      const res = await fetch(`${API_URL}/api/patients`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || 'Failed to create patient');
      }
      return res.json();
    }
  },
 
  tasks: {
    list: async (patientId: string) => {
      const res = await fetch(`${API_URL}/api/patients/${patientId}/tasks`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    create: async (patientId: string, title: string) => {
      const res = await fetch(`${API_URL}/api/patients/${patientId}/tasks`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title })
      });
      if (!res.ok) throw new Error('Failed to create task');
      return res.json();
    },
    toggle: async (taskId: number, completed: boolean) => {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ completed })
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    delete: async (taskId: any) => {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete task');
      return res.json();
    }
  },
 
  assessments: {
    list: async (patientId: string) => {
      const res = await fetch(`${API_URL}/api/patients/${patientId}/assessments`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch assessments');
      return res.json();
    },
    save: async (patientId: string, type: string, data: any) => {
      const res = await fetch(`${API_URL}/api/patients/${patientId}/assessments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ assessmentType: type, data })
      });
      if (!res.ok) throw new Error('Failed to save assessment');
      return res.json();
    }
  },
 
  data: {
    get: async (patientId: string, type: string) => {
      const res = await fetch(`${API_URL}/api/patients/${patientId}/data/${type}`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch data');
      return res.json();
    },
    save: async (patientId: string, type: string, data: any) => {
      const res = await fetch(`${API_URL}/api/patients/${patientId}/data/${type}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ data })
      });
      if (!res.ok) throw new Error('Failed to save data');
      return res.json();
    }
  },
 
  files: {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload file');
      return res.json();
    }
  }
};
 