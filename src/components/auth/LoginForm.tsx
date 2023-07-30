import React, { useState } from 'react';
import { IonButton, IonCol, IonGrid, IonInput, IonRow, IonText } from '@ionic/react';
import { auth } from '../../firebaseConfig';

import './LoginForm.css'; // Import the CSS file

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!validateEmail(email)) {
      setError('Invalid email format');
      return;
    }

    try {
      await auth.signInWithEmailAndPassword(email, password);
      console.log('User logged in successfully');
      // Redirect to the dashboard or desired page
      // You can replace the following line with your own navigation logic
      window.location.href = '/dashboard';
    } catch (error) {
      setError('Login failed. Please check your credentials.');
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <IonGrid className="login-form">
      <IonRow>
        <IonCol size="12" size-md="8" offset-md="2" size-lg="6" offset-lg="3">
          <h2>Login</h2>
          {error && <IonText color="danger">{error}</IonText>}
          <div className="form-group">
            <IonInput
              type="email"
              placeholder="Email"
              value={email}
              onIonChange={(e) => setEmail(e.detail.value!)}
            />
          </div>
          <div className="form-group">
            <IonInput
              type="password"
              placeholder="Password"
              value={password}
              onIonChange={(e) => setPassword(e.detail.value!)}
            />
          </div>
          <IonButton expand="full" onClick={handleLogin}>
            Login
          </IonButton>
        </IonCol>
      </IonRow>
    </IonGrid>
  );
};

export default LoginForm;
