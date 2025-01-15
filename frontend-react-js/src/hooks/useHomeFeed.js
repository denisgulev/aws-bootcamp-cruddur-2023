import { useState, useEffect, useRef } from "react";
import { setAccessToken } from '../hooks/useAuth';

export function useHomeFeed() {
  const [activities, setActivities] = useState([]);
  const [popped, setPopped] = useState(false);
  const [poppedReply, setPoppedReply] = useState(false);
  const [replyActivity, setReplyActivity] = useState({});
  const dataFetchedRef = useRef(false);

  const loadData = async () => {
    try {
      await setAccessToken();
      const access_token = localStorage.getItem('access_token')

      const backend_url = `${process.env.REACT_APP_BACKEND_URL}/api/activities/home`;
      const response = await fetch(backend_url, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        method: "GET"
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      } else {
        console.error("Failed to fetch activities:", response);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  useEffect(() => {
    if (dataFetchedRef.current) return;
    dataFetchedRef.current = true;
    loadData();
  }, []);

  return {
    activities,
    setActivities,
    replyActivity,
    setReplyActivity,
    popped,
    setPopped,
    poppedReply,
    setPoppedReply,
  };
}