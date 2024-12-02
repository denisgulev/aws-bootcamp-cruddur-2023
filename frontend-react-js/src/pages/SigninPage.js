import './SigninPage.css';
import React, { useState } from "react";
import { ReactComponent as Logo } from '../components/svg/logo.svg';
import { Link } from "react-router-dom";
import { signIn, fetchAuthSession } from 'aws-amplify/auth';

export default function SigninPage() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState('');

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors('');

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: credentials.email,
        password: credentials.password,
      });

      if (isSignedIn) {
        const session = await fetchAuthSession();
        const { accessToken } = session.tokens ?? {};
        localStorage.setItem('access_token', accessToken);
        window.location.href = '/';
      }
    } catch (error) {
      console.error("Error during sign-in operation:", error);
      if (error.code === 'UserNotConfirmedException') {
        window.location.href = '/confirm';
      } else {
        setErrors(error.message || 'An error occurred during sign-in.');
      }
    }
  };

  return (
    <article className="signin-article">
      <div className="signin-info">
        <Logo className="logo" />
      </div>
      <div className="signin-wrapper">
        <form className="signin_form" onSubmit={handleSubmit}>
          <h2>Sign into your Cruddur account</h2>
          <div className="fields">
            <div className="field text_field email">
              <label>Email</label>
              <input
                type="text"
                name="email"
                value={credentials.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="field text_field password">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
              />
            </div>
          </div>
          {errors && <div className="errors">{errors}</div>}
          <div className="submit">
            <Link to="/forgot" className="forgot-link">
              Forgot Password?
            </Link>
            <button type="submit">Sign In</button>
          </div>
        </form>
        <div className="dont-have-an-account">
          <span>Don't have an account?</span>
          <Link to="/signup">Sign up!</Link>
        </div>
      </div>
    </article>
  );
}