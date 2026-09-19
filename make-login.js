const fs = require('fs');

const loginHtml = fs.readFileSync('gemini-code-1789846813780.html', 'utf8');
const homeTsx = fs.readFileSync('app/page.tsx', 'utf8');

// Extract logo SVG from homeTsx
const logoMatch = homeTsx.match(/<a className="logo" href="\/".*?>(<svg[\s\S]*?<\/svg>)<\/a>/);
let logoSvg = logoMatch ? logoMatch[1] : '<span>Logo</span>';

// Extract CSS from loginHtml
const styleMatch = loginHtml.match(/<style>([\s\S]*?)<\/style>/);
let css = styleMatch ? styleMatch[1] : '';

// Replace body with .login-page-container
css = css.replace(/body \{/g, '.login-page-container {\n');

fs.writeFileSync('app/login/login.css', css);

// We need to generate page.tsx
const pageContent = `'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import './login.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Load font awesome for icons
  useEffect(() => {
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(link);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="card-container">
        {/* Left Side with Image Banner & Logo */}
        <div className="banner-side">
          <div className="logo" style={{ width: '240px' }}>
            ${logoSvg}
          </div>
        </div>

        {/* Right Side with Sign Up Form */}
        <div className="form-side">
          <h2>Log In</h2>

          {error && (
            <div style={{ width: '100%', marginBottom: '16px', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #f87171', color: '#dc2626', borderRadius: '4px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <button type="button" className="google-btn">
            <span>Log in with Google</span>
            <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="input-group">
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <i 
                className={\`fa-regular password-toggle \${showPassword ? 'fa-eye' : 'fa-eye-slash'}\`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="social-icons">
            <a href="#"><i className="fa-brands fa-facebook-f"></i></a>
            <a href="#"><i className="fa-brands fa-twitter"></i></a>
            <a href="#"><i className="fa-brands fa-linkedin-in"></i></a>
            <a href="#"><i className="fa-brands fa-instagram"></i></a>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('app/login/page.tsx', pageContent);
console.log('Login page successfully updated.');
