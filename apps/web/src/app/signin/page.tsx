'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function SignInPage() {
  const [email, setEmail] = useState('admin@iqmeridian.local');
  const [password, setPassword] = useState('password123');

  return (
    <main style={{ padding: '2rem' }}>
      <h1>IQMeridian Sign In</h1>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await signIn('credentials', {
            email,
            password,
            callbackUrl: '/dashboard',
          });
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <label>Email</label>
          <br />
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Password</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit">Sign in</button>
      </form>
    </main>
  );
}
