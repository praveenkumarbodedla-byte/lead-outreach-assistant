/**
 * localStorage persistence for leads and settings
 */

const LEADS_KEY = 'loa_leads_v1';
const SETTINGS_KEY = 'loa_settings_v1';

export function saveLeads(leads) {
  try {
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
  } catch (e) {
    console.error('Failed to save leads:', e);
  }
}

export function loadLeads() {
  try {
    const raw = localStorage.getItem(LEADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function clearAllData() {
  localStorage.removeItem(LEADS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}
