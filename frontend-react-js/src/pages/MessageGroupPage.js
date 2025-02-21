import './MessageGroupPage.css';
import React from "react";
import { useParams } from 'react-router-dom';

import DesktopNavigation from '../components/DesktopNavigation';
import MessageGroupFeed from '../components/MessageGroupFeed';
import MessagesFeed from '../components/MessageFeed';
import MessagesForm from '../components/MessageForm';
import { useAuth } from '../hooks/useAuth'; // Import the useAuth hook
import { useHomeFeed } from '../hooks/useHomeFeed';
import { get } from '../lib/Requests';

export default function MessageGroupPage() {
  const [messageGroups, setMessageGroups] = React.useState([]);
  const [messages, setMessages] = React.useState([]);
  const dataFetchedRef = React.useRef(false);
  const { setPopped } = useHomeFeed();
  const { user } = useAuth();
  const params = useParams();

  const loadMessageGroupsData = async () => {
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/message_groups`

    get(url, {
      auth: true,
      success: function (data) {
        setMessageGroups(data)
      }
    })
  };

  const loadMessageGroupData = async () => {
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/messages/${params.message_group_uuid}`

    get(url, {
      auth: true,
      success: function (data) {
        setMessages(data)
      }
    })
  };

  React.useEffect(() => {
    if (dataFetchedRef.current) return;
    dataFetchedRef.current = true;

    loadMessageGroupsData();
    loadMessageGroupData();
  }, [])
  return (
    <article>
      <DesktopNavigation user={user} active="messages" setPopped={setPopped} />
      <section className='message_groups'>
        <MessageGroupFeed message_groups={messageGroups} />
      </section>
      <div className='content messages'>
        <MessagesFeed messages={messages} />
        <MessagesForm setMessages={setMessages} />
      </div>
    </article>
  );
}