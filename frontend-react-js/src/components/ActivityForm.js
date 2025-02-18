import './ActivityForm.css';
import React, { useState } from "react";
import { ReactComponent as BombIcon } from './svg/bomb.svg';
import { setAccessToken } from '../hooks/useAuth';

export default function ActivityForm({ popped, setPopped, setActivities }) {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');
  const [ttl, setTtl] = useState('7-days');

  // Dynamically set class for character count
  const charCountClasses = ['count'];
  if (240 - count < 0) {
    charCountClasses.push('err');
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const backendUrl = `${process.env.REACT_APP_BACKEND_URL}/api/activities`;

      await setAccessToken();
      const access_token = localStorage.getItem('access_token')

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, ttl }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add the new activity to the feed
        setActivities((current) => [data, ...current]);
        // Reset the form
        resetForm();
      } else {
        console.error('Failed to submit activity:', await response.text());
      }
    } catch (error) {
      console.error('Error submitting activity:', error);
    }
  };

  const handleTextareaChange = (event) => {
    const newMessage = event.target.value;
    setCount(newMessage.length);
    setMessage(newMessage);
  };

  const handleTtlChange = (event) => {
    setTtl(event.target.value);
  };

  const resetForm = () => {
    setCount(0);
    setMessage('');
    setTtl('7-days');
    setPopped(false);
  };

  // Render the form only when `popped` is true
  if (!popped) return null;

  return (
    <form className="activity_form" onSubmit={handleSubmit}>
      <textarea
        type="text"
        placeholder="What would you like to say?"
        value={message}
        onChange={handleTextareaChange}
      />
      <div className="submit">
        <div className={charCountClasses.join(' ')}>{240 - count}</div>
        <button type="submit">Crud</button>
        <div className="expires_at_field">
          <BombIcon className="icon" />
          <select value={ttl} onChange={handleTtlChange}>
            <option value="30-days">30 days</option>
            <option value="7-days">7 days</option>
            <option value="3-days">3 days</option>
            <option value="1-day">1 day</option>
            <option value="12-hours">12 hours</option>
            <option value="3-hours">3 hours</option>
            <option value="1-hour">1 hour</option>
          </select>
        </div>
      </div>
    </form>
  );
}