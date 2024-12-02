import './SignupPage.css';
import React, { useState } from "react";
import { ReactComponent as Logo } from '../components/svg/logo.svg';
import { Link } from "react-router-dom";
import { signUp } from "aws-amplify/auth";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState('');

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors('');

    try {
      const { nextStep } = await signUp({
        username: formData.email,
        password: formData.password,
        options: {
          userAttributes: {
            name: formData.name,
            email: formData.email,
            preferred_username: formData.username,
          },
        },
        autoSignIn: {
          enabled: true,
        },
      });

      if (nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
        window.location.href = `/confirm?email=${formData.email}`;
      }
    } catch (error) {
      console.error(error);
      setErrors(error.message || 'An error occurred during signup.');
    }
  };

  return (
    <article className="signup-article">
      <div className="signup-info">
        <Logo className="logo" />
      </div>
      <div className="signup-wrapper">
        <form className="signup_form" onSubmit={handleSubmit}>
          <h2>Sign up to create a Cruddur account</h2>
          <div className="fields">
            {["name", "email", "username", "password"].map((field) => (
              <div key={field} className={`field text_field ${field}`}>
                <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                <input
                  type={field === "password" ? "password" : "text"}
                  name={field}
                  value={formData[field]}
                  onChange={handleInputChange}
                />
              </div>
            ))}
          </div>
          {errors && <div className="errors">{errors}</div>}
          <div className="submit">
            <button type="submit">Sign Up</button>
          </div>
        </form>
        <div className="already-have-an-account">
          <span>Already have an account?</span>
          <Link to="/signin">Sign in!</Link>
        </div>
      </div>
    </article>
  );
}