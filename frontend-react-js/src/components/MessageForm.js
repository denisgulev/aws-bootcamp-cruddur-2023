import './MessageForm.css';
import React, { useState } from "react";
import { useParams } from 'react-router-dom';
import { post } from '../lib/Requests';
import FormErrors from '../components/FormErrors';

export default function MessageForm(props) {
  const [message, setMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [errors, setErrors] = useState({});
  const params = useParams();

  const isCharCountValid = charCount <= 1024;

  const handleTextChange = (event) => {
    const newText = event.target.value;
    setMessage(newText);
    setCharCount(newText.length);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({})
    if (!isCharCountValid) return;

    const payload_data = {
      message: message
    }
    if (params.handle) {
      payload_data.handle = params.handle
    } else {
      payload_data.message_group_uuid = params.message_group_uuid
    }
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/messages`

    post(url, payload_data, {
      auth: true,
      setErrors: setErrors,
      success: function (data) {
        console.log('data:', data)
        if (data.message_group_uuid) {
          console.log('redirect to message group')
          window.location.href = `/messages/${data.message_group_uuid}`
        } else {
          props.setMessages(current => [...current, data]);
        }
      }
    })
  };

  return (
    <form className="message_form" onSubmit={handleSubmit}>
      <textarea
        placeholder="Send a direct message..."
        value={message}
        onChange={handleTextChange}
        maxLength={1024}
      />
      <div className="submit">
        <div className={`count ${isCharCountValid ? '' : 'err'}`}>
          {1024 - charCount}
        </div>
        <button type="submit" disabled={!isCharCountValid}>
          Message
        </button>
      </div>
      <FormErrors errors={errors} />
    </form>
  );
}