import './MessageForm.css';
import React, { useState } from "react";
import { useParams } from 'react-router-dom';

export default function MessageForm({ setMessages }) {
  const [message, setMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const { handle: receiverHandle } = useParams();

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
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          user_receiver_handle: receiverHandle,
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages((currentMessages) => [...currentMessages, newMessage]);
        setMessage('');
        setCharCount(0);
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