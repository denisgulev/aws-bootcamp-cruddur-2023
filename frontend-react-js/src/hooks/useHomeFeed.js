import { useState, useEffect, useRef } from "react";
import { get } from '../lib/Requests';

export function useHomeFeed() {
  const [activities, setActivities] = useState([]);
  const [popped, setPopped] = useState(false);
  const [poppedReply, setPoppedReply] = useState(false);
  const [replyActivity, setReplyActivity] = useState({});
  const dataFetchedRef = useRef(false);

  const loadData = async () => {
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/activities/home`

    get(url, {
      auth: true,
      success: function (data) {
        setActivities(data)
      }
    })
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