import './ConfirmationPage.css';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ReactComponent as Logo } from '../components/svg/logo.svg';
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';

export default function ConfirmationPage() {
  const [formData, setFormData] = useState({ email: '', code: '' });
  const [errors, setErrors] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const { email: paramEmail } = useParams();

  // Handle input changes generically
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Resend activation code
  const handleResendCode = async () => {
    setErrors('');
    try {
      const { destination, deliveryMedium } = await resendSignUpCode({ username: formData.email });
      console.log(`A confirmation code has been sent to ${destination}. Check your ${deliveryMedium} for the code.`);
      setCodeSent(true);
    } catch (err) {
      console.error(err);
      if (err.message === 'Username cannot be empty') {
        setErrors('You need to provide an email to resend the activation code.');
      } else if (err.message === 'Username/client id combination not found.') {
        setErrors('Email is invalid or cannot be found.');
      } else {
        setErrors(err.message || 'An error occurred while resending the code.');
      }
    }
  };

  // Submit confirmation
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors('');
    try {
      await confirmSignUp({ username: formData.email, confirmationCode: formData.code });
      window.location.href = '/';
    } catch (error) {
      console.error(error);
      setErrors(error.message || 'An error occurred during confirmation.');
    }
  };

  // Pre-fill email if provided in params
  useEffect(() => {
    if (paramEmail) {
      setFormData((prev) => ({ ...prev, email: paramEmail }));
    }
  }, [paramEmail]);

  return (
    <article className="confirm-article">
      <div className="recover-info">
        <Logo className="logo" />
      </div>
      <div className="recover-wrapper">
        <form className="confirm_form" onSubmit={handleSubmit}>
          <h2>Confirm your Email</h2>
          <div className="fields">
            <div className="field text_field email">
              <label>Email</label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="field text_field code">
              <label>Confirmation Code</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
              />
            </div>
          </div>
          {errors && <div className="errors">{errors}</div>}
          <div className="submit">
            <button type="submit">Confirm Email</button>
          </div>
        </form>
      </div>
      {codeSent ? (
        <div className="sent-message">A new activation code has been sent to your email.</div>
      ) : (
        <button className="resend" onClick={handleResendCode}>
          Resend Activation Code
        </button>
      )}
    </article>
  );
}