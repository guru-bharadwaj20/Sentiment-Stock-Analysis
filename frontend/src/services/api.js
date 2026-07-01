import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const client = axios.create({ baseURL: BASE, timeout: 30_000 });

export async function analyzeTicker(ticker) {
  const { data } = await client.get(`/analyze/${ticker.toUpperCase()}`);
  return data;
}

export async function getHistory(ticker) {
  const { data } = await client.get(`/history/${ticker.toUpperCase()}`);
  return data.history ?? [];
}
