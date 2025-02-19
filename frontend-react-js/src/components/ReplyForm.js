import './ReplyForm.css';
import React, { useState } from "react";

import ActivityContent from '../components/ActivityContent';
import FormErrors from '../components/FormErrors';
import { post } from '../lib/Requests';

export default function ReplyForm({ popped, setPopped, activity, activities, setActivities, setReplies }) {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  // Dynamically set class for character count
  const charCountClasses = ['count'];
  if (240 - count < 0) {
    charCountClasses.push('err');
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({})

    const payload_data = {
      activity_uuid: activity.uuid,
      message: message
    }
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/activities/${activity.uuid}/reply`

    post(url, payload_data, {
      auth: true,
      setErrors: setErrors,
      success: function (data) {
        if (setReplies) {
          setReplies(current => [data, ...current]);
        }

        // Reset the form
        resetForm();
      }
    })
  };

  const handleTextareaChange = (event) => {
    setCount(event.target.value.length);
    setMessage(event.target.value);
  };

  const resetForm = () => {
    setCount(0);
    setMessage('');
    setPopped(false);
  };

  const close = (event) => {
    if (event.target.classList.contains("reply_popup")) {
      setPopped(false)
    }
  }

  if (!popped) return null;

  return (
    <div className="popup_form_wrap reply_popup" onClick={close}>
      <div className="popup_form">
        <div className="popup_heading">
          <div className="popup_title">
            Reply to...
          </div>
        </div>
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
            <FormErrors errors={errors} />
          </form>
        </div>
      </div>
    </div>
  );
}