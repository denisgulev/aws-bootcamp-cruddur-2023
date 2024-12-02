import './ReplyForm.css';
import React, { useState } from "react";
import { ReactComponent as BombIcon } from './svg/bomb.svg';

import ActivityContent from '../components/ActivityContent';

export default function ReplyForm({ popped, setPopped, activity, activities, setActivities }) {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');

  // Dynamically set class for character count
  const charCountClasses = ['count'];
  if (240 - count < 0) {
    charCountClasses.push('err');
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const backendUrl = `${process.env.REACT_APP_BACKEND_URL}/api/activities/${activity.uuid}/reply`;
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the activity's replies in a deep copy of activities
        const updatedActivities = activities.map((item) =>
          item.uuid === activity.uuid
            ? { ...item, replies: [...item.replies, data] }
            : item
        );
        setActivities(updatedActivities);

        // Reset the form
        resetForm();
      } else {
        console.error('Failed to submit reply:', await response.text());
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const handleTextareaChange = (event) => {
    const newMessage = event.target.value;
    setCount(newMessage.length);
    setMessage(newMessage);
  };

  const resetForm = () => {
    setCount(0);
    setMessage('');
    setPopped(false);
  };

  if (!popped) return null;

  return (
    <div className="popup_form_wrap">
      <div className="popup_form">
        <div className="popup_heading"></div>
        <div className="popup_content">
          <div className="activity_wrap">
            {activity && <ActivityContent activity={activity} />}
          </div>
          <form className="replies_form" onSubmit={handleSubmit}>
            <textarea
              type="text"
              placeholder="What is your reply?"
              value={message}
              onChange={handleTextareaChange}
            />
            <div className="submit">
              <div className={charCountClasses.join(' ')}>{240 - count}</div>
              <button type="submit">Reply</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}