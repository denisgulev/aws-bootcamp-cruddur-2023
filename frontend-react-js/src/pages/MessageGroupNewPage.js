import './MessageGroupPage.css';
import React from "react";
import { useParams } from 'react-router-dom';

import DesktopNavigation from '../components/DesktopNavigation';
import MessageGroupFeed from '../components/MessageGroupFeed';
import MessagesFeed from '../components/MessageFeed';
import MessagesForm from '../components/MessageForm';
import { useAuth } from '../hooks/useAuth';
import { useHomeFeed } from '../hooks/useHomeFeed';
import { get } from '../lib/Requests';

export default function MessageGroupNewPage() {
    const [otherUser, setOtherUser] = React.useState([]);
    const [messageGroups, setMessageGroups] = React.useState([]);
    const [messages, setMessages] = React.useState([]);
    const { setPopped } = useHomeFeed();
    const { user } = useAuth();
    const dataFetchedRef = React.useRef(false);
    const params = useParams();

    const loadUserShortData = async () => {
        const url = `${process.env.REACT_APP_BACKEND_URL}/api/users/@${params.handle}/short`

        get(url, {
            auth: true,
            success: function (data) {
                console.log('other user:', data)
                setOtherUser(data)
            }
        })
    };

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
        loadUserShortData();
    }, [])
    return (
        <article>
            <DesktopNavigation user={user} active={'home'} setPopped={setPopped} />
            <section className='message_groups'>
                <MessageGroupFeed otherUser={otherUser} message_groups={messageGroups} />
            </section>
            <div className='content messages'>
                <MessagesFeed messages={messages} />
                <MessagesForm setMessages={setMessages} />
            </div>
        </article>
    );
}