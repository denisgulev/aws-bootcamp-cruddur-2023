import './MessageForm.css';
import React, { useState } from "react";
import { useParams } from 'react-router-dom';
import { setAccessToken } from '../hooks/useAuth';

export default function MessageForm(props) {
  const [message, setMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const params = useParams();

  const isCharCountValid = charCount <= 1024;

  const handleTextChange = (event) => {
    const newText = event.target.value;
    setMessage(newText);
    setCharCount(newText.length);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isCharCountValid) return;

    const backendUrl = `${process.env.REACT_APP_BACKEND_URL}/api/messages`;

    try {
      let json = {
        message: message
      }
      if (params.handle) {
        json.handle = params.handle
      } else {
        json.message_group_uuid = params.message_group_uuid
      }

      await setAccessToken();
      const access_token = localStorage.getItem('access_token')

      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json)
      });

      const data = await response.json();

      if (response.ok) {
        console.log('data:', data)
        if (data.message_group_uuid) {
          console.log('redirect to message group')
          window.location.href = `/messages/${data.message_group_uuid}`
        } else {
          props.setMessages(current => [...current, data]);
        }
      } else {
        console.error("Failed to send message", response);
      }
    } catch (error) {
      console.error("Error submitting the message", error);
    }
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
    </form>
  );
}