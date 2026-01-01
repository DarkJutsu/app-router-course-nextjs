import { Suspense } from 'react';
import AcmeLogo from '../ui/acme-logo';
import LoginForm from '../ui/login-form';

export default function LoginPage() {
  return (
    <main>
      <div>
        <div>
          <div>
            <AcmeLogo />
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
