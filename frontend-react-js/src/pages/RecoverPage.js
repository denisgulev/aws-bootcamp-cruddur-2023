import './RecoverPage.css';
import React, { useState } from 'react';
import { ReactComponent as Logo } from '../components/svg/logo.svg';
import { Link } from 'react-router-dom';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';

export default function RecoverPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordAgain: '',
    code: '',
  });
  const [errors, setErrors] = useState('');
  const [formState, setFormState] = useState('send_code');

  // Generic input change handler
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Send recovery code
  const handleSendCode = async (event) => {
    event.preventDefault();
    setErrors('');
    try {
      await resetPassword({ username: formData.username });
      setFormState('confirm_code');
    } catch (err) {
      setErrors(err.message || 'An error occurred while sending the recovery code.');
    }
  };

  // Confirm reset password
  const handleConfirmReset = async (event) => {
    event.preventDefault();
    setErrors('');
    if (formData.password !== formData.passwordAgain) {
      setErrors('Passwords do not match');
      return;
    }
    try {
      await confirmResetPassword({
        username: formData.username,
        confirmationCode: formData.code,
        newPassword: formData.password,
      });
      setFormState('success');
    } catch (err) {
      setErrors(err.message || 'An error occurred while resetting the password.');
    }
  };

  // Render form content based on the state
  const renderFormContent = () => {
    switch (formState) {
      case 'send_code':
        return (
          <form className="recover_form" onSubmit={handleSendCode}>
            <h2>Recover your Password</h2>
            <div className="fields">
              <div className="field text_field username">
                <label>Email</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            {errors && <div className="errors">{errors}</div>}
            <div className="submit">
              <button type="submit">Send Recovery Code</button>
            </div>
          </form>
        );

      case 'confirm_code':
        return (
          <form className="recover_form" onSubmit={handleConfirmReset}>
            <h2>Recover your Password</h2>
            <div className="fields">
              <div className="field text_field code">
                <label>Reset Password Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                />
              </div>
              <div className="field text_field password">
                <label>New Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
              <div className="field text_field password_again">
                <label>New Password Again</label>
                <input
                  type="password"
                  name="passwordAgain"
                  value={formData.passwordAgain}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            {errors && <div className="errors">{errors}</div>}
            <div className="submit">
              <button type="submit">Reset Password</button>
            </div>
          </form>
        );

      case 'success':
        return (
          <div className="success-message">
            <p>Your password has been successfully reset!</p>
            <Link to="/signin" className="proceed">Proceed to Sign In</Link>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <article className="recover-article">
      <div className="recover-info">
        <Logo className="logo" />
      </div>
      <div className="recover-wrapper">
        {renderFormContent()}
      </div>
    </article>
  );
}