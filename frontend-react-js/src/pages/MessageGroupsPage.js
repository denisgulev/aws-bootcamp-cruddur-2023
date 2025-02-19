import './MessageGroupsPage.css';
import React from "react";

import DesktopNavigation from '../components/DesktopNavigation';
import MessageGroupFeed from '../components/MessageGroupFeed';
import { useAuth } from '../hooks/useAuth'; // Import the useAuth hook
import { useHomeFeed } from '../hooks/useHomeFeed';
import { get } from '../lib/Requests';

export default function MessageGroupsPage() {
  const [messageGroups, setMessageGroups] = React.useState([]);
  const dataFetchedRef = React.useRef(false);
  const { setPopped } = useHomeFeed();
  const { user } = useAuth();

  const loadMessageGroupsData = async () => {
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/message_groups`

    get(url, {
      auth: true,
      success: function (data) {
        setMessageGroups(data)
      }
    })
  };

  React.useEffect(() => {
    //prevents double call
    if (dataFetchedRef.current) return;
    dataFetchedRef.current = true;

    loadMessageGroupsData();
  }, [])
  return (
    <article>
      <DesktopNavigation user={user} active="messages" setPopped={setPopped} />
      <section className='message_groups'>
        <MessageGroupFeed message_groups={messageGroups} />
      </section>
      <div className='content'>
      </div>
    </article>
  );
}