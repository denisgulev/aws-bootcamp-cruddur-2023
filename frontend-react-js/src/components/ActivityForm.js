import "./ActivityForm.css";
import React, { useState } from "react";
import { ReactComponent as BombIcon } from "./svg/bomb.svg";
import FormErrors from "../components/FormErrors";
import { post } from "../lib/Requests";

export default function ActivityForm({ popped, setPopped, setActivities }) {
  const [message, setMessage] = useState("");
  const [ttl, setTtl] = useState("7-days");
  const [errors, setErrors] = useState({});

  const characterLimit = 240;
  const remainingCharacters = characterLimit - message.length;
  const isOverLimit = remainingCharacters < 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});

    const payload = { ttl, message };
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/activities`;

    post(url, payload, {
      auth: true,
      setErrors,
      success: (data) => {
        setActivities((current) => [data, ...current]);
        resetForm();
      },
    });
  };

  const handleMessageChange = (event) => setMessage(event.target.value);
  const handleTtlChange = (event) => setTtl(event.target.value);
  const handleClose = () => setPopped(false);

  const resetForm = () => {
    setMessage("");
    setTtl("7-days");
    setPopped(false);
  };

  if (!popped) return null;

  return (
    <form className="activity-form" onSubmit={handleSubmit}>
      <textarea
        placeholder="What would you like to say?"
        value={message}
        onChange={handleMessageChange}
      />
      <div className="activity-form__footer">
        <div className={`activity-form__char-count ${isOverLimit ? "error" : ""}`}>
          {remainingCharacters}
        </div>
        <button type="submit" disabled={isOverLimit}>
          Post
        </button>
        <div className="activity-form__ttl">
          <BombIcon className="activity-form__icon" />
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
        <button type="button" className="activity-form__close" onClick={handleClose}>
          Close
        </button>
      </div>
      <FormErrors errors={errors} />
    </form>
  );
}