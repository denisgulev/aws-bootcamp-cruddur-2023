import './ReplyForm.css';
import React, { useState } from 'react';

import ActivityContent from '../components/ActivityContent';
import FormErrors from '../components/FormErrors';
import { post } from '../lib/Requests';

export default function ReplyForm({ popped, setPopped, activity, setReplies }) {
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  const characterLimit = 240;
  const remainingCharacters = characterLimit - message.length;
  const isOverLimit = remainingCharacters < 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});

    const payload = { activity_uuid: activity.uuid, message };
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/activities/${activity.uuid}/reply`;

    post(url, payload, {
      auth: true,
      setErrors,
      success: (data) => {
        if (setReplies) {
          setReplies((current) => [data, ...current]);
        }
        resetForm();
      },
    });
  };

  const handleTextareaChange = (event) => {
    const newMessage = event.target.value;
    setMessage(newMessage);
  };

  const resetForm = () => {
    setMessage('');
    setPopped(false);
  };

  const handleClose = () => setPopped(false);

  const closePopup = (event) => {
    if (event.target.classList.contains('reply-popup')) {
      setPopped(false);
    }
  };

  if (!popped) return null;

  return (
    <div className="reply-popup" onClick={closePopup}>
      <div className="popup-form">
        <div className="popup-content">
          <div className="activity-wrap">
            {activity && <ActivityContent activity={activity} />}
          </div>
          <form className="replies-form" onSubmit={handleSubmit}>
            <textarea
              placeholder="What is your reply?"
              value={message}
              onChange={handleTextareaChange}
            />
            <div className="submit">
              <div className={`activity-form__char-count ${isOverLimit ? "error" : ""}`}>
                {remainingCharacters}
              </div>
              <button type="submit" disabled={isOverLimit}>Reply</button>
              <button type="button" className="activity-form__close" onClick={handleClose}>
                Close
              </button>
            </div>
            <FormErrors errors={errors} />
          </form>
        </div>
      </div>
    </div>
  );
}