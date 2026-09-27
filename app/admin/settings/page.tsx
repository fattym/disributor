'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import type { AdminSettings } from '@/lib/adminApi';
import { mockSettings } from '@/lib/adminApi';

const sections = [
  { id: 'general', label: 'General' },
  { id: 'payments', label: 'Payment Settings' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
  { id: 'commission', label: 'Commission' },
  { id: 'tax', label: 'Tax' },
  { id: 'currency', label: 'Currency' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
];

const Toggle = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-800">
    <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
        value ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-600'
      }`}
      aria-label={value ? 'ON' : 'OFF'}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          value ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
      <span className="sr-only">{value ? 'ON' : 'OFF'}</span>
    </button>
  </div>
);

export default function SettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>(mockSettings);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('general');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await adminApi.getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const update = (field: keyof AdminSettings, value: unknown) => {
    setSettings({ ...settings, [field]: value });
  };

  const saveSettings = async () => {
    try {
      await adminApi.updateSettings(settings);
      setMessage('Settings saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to save settings');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return <div className="text-lg">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Configure platform-wide settings</p>
      </div>

      {message && (
        <div className="p-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md">
          {message}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <nav className="md:w-56 flex md:flex-col gap-1 md:gap-2 overflow-x-auto md:overflow-x-visible">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              className={`px-3 py-2 text-sm font-medium text-left rounded-md transition-colors ${
                activeSection === s.id
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="flex-1">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {sections.find((s) => s.id === activeSection)?.label}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {activeSection === 'general' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Default Country</label>
                    <select
                      value={settings.default_country}
                      onChange={(e) => update('default_country', e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    >
                      <option value="Kenya">Kenya</option>
                      <option value="Uganda">Uganda</option>
                      <option value="Tanzania">Tanzania</option>
                    </select>
                  </div>
                  <Toggle
                    label="Allow Seller Registration"
                    value={settings.allow_seller_registration}
                    onChange={(v) => update('allow_seller_registration', v)}
                  />
                  <Toggle
                    label="Require Product Approval"
                    value={settings.require_product_approval}
                    onChange={(v) => update('require_product_approval', v)}
                  />
                  <Toggle
                    label="Require Course Approval"
                    value={settings.require_course_approval}
                    onChange={(v) => update('require_course_approval', v)}
                  />
                </>
              )}

              {activeSection === 'payments' && (
                <>
                  <Toggle label="M-Pesa Enabled" value={settings.mpesa_enabled} onChange={(v) => update('mpesa_enabled', v)} />
                  <Toggle label="Visa Enabled" value={settings.visa_enabled} onChange={(v) => update('visa_enabled', v)} />
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Mastercard</label>
                    <select
                      defaultValue="enabled"
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    >
                      <option value="enabled">Enabled</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                </>
              )}

              {activeSection === 'shipping' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Shipping Zones</label>
                    <select
                      defaultValue="kenya"
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    >
                      <option value="kenya">Kenya Only</option>
                      <option value="east-africa">East Africa</option>
                      <option value="global">Global</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Base Shipping Fee (KSh)</label>
                    <input
                      type="number"
                      defaultValue="200"
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    />
                  </div>
                </div>
              )}

              {activeSection === 'email' && (
                <div className="space-y-3">
                  <input type="email" placeholder="SMTP Host" defaultValue="smtp.learningpack.ke" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100" />
                  <input type="number" placeholder="SMTP Port" defaultValue="587" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100" />
                  <input type="text" placeholder="From Address" defaultValue="noreply@learningpack.ke" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100" />
                </div>
              )}

              {activeSection === 'sms' && (
                <div className="space-y-3">
                  <input type="text" placeholder="SMS Gateway" defaultValue="AfricaTalking" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100" />
                  <input type="text" placeholder="API Key" defaultValue="••••••••••••" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100" />
                </div>
              )}

              {activeSection === 'commission' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Platform Commission (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.commission}
                      onChange={(e) => update('commission', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Charged on each seller sale. Current: {settings.commission}%
                    </p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Example payout (KSh 10,000 sale):</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Sale</span>
                        <span className="text-zinc-900 dark:text-zinc-100">KSh 10,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Learning Pack fee ({settings.commission}%)</span>
                        <span className="text-zinc-900 dark:text-zinc-100">KSh {(10000 * (settings.commission / 100)).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t border-zinc-200 dark:border-zinc-800 pt-1">
                        <span className="text-zinc-600 dark:text-zinc-400">Seller receives</span>
                        <span className="text-zinc-900 dark:text-zinc-100">KSh {(10000 * (1 - settings.commission / 100)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'tax' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.tax_rate}
                      onChange={(e) => update('tax_rate', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    />
                  </div>
                  <Toggle label="Tax Enabled" value={settings.tax_rate > 0} onChange={(v) => update('tax_rate', v ? 16 : 0)} />
                </div>
              )}

              {activeSection === 'currency' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Currency</label>
                    <select
                      value={settings.currency}
                      onChange={(e) => update('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    >
                      <option value="KES">Kenya Shillings (KES)</option>
                      <option value="UGX">Uganda Shillings (UGX)</option>
                      <option value="TZS">Tanzania Shillings (TZS)</option>
                      <option value="USD">US Dollar (USD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Currency Symbol</label>
                    <input
                      type="text"
                      value={settings.currency_symbol}
                      onChange={(e) => update('currency_symbol', e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    />
                  </div>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="space-y-3">
                  <Toggle label="Two-Factor Authentication" value={true} onChange={() => {}} />
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password Policy</label>
                    <input type="text" defaultValue="Minimum 8 characters" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Session Timeout (minutes)</label>
                    <input type="number" defaultValue="30" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100" />
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="space-y-3">
                  <Toggle
                    label="Email Notifications"
                    value={settings.email_notifications}
                    onChange={(v) => update('email_notifications', v)}
                  />
                  <Toggle label="SMS Alerts" value={false} onChange={() => {}} />
                  <Toggle label="Admin Dashboard Alerts" value={true} onChange={() => {}} />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={saveSettings}
              className="px-5 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
