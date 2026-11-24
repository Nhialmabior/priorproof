import { initialData } from '../data/demoData.js';
const KEY = 'priorproof-demo-v1';

export function getData() {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? JSON.parse(saved) : structuredClone(initialData);
  } catch {
    return structuredClone(initialData);
  }
}
export function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('priorproof:data-updated'));
}
export function resetData() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent('priorproof:data-updated'));
  return getData();
}
