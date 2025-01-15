import './MessageGroupPage.css';
import React from "react";
import { useParams } from 'react-router-dom';

import DesktopNavigation from '../components/DesktopNavigation';
import MessageGroupFeed from '../components/MessageGroupFeed';
import MessagesFeed from '../components/MessageFeed';
import MessagesForm from '../components/MessageForm';
import { useAuth } from '../hooks/useAuth';
import { useHomeFeed } from '../hooks/useHomeFeed';
import { setAccessToken } from '../hooks/useAuth';

export default function MessageGroupNewPage() {
    const [otherUser, setOtherUser] = React.useState([]);
    const [messageGroups, setMessageGroups] = React.useState([]);
    const [messages, setMessages] = React.useState([]);
    const { setPopped } = useHomeFeed();
    const { user } = useAuth();
    const dataFetchedRef = React.useRef(false);
    const params = useParams();

    const loadUserShortData = async () => {
        try {
            const backend_url = `${process.env.REACT_APP_BACKEND_URL}/api/users/${params.handle}/short`
            const res = await fetch(backend_url, {
                method: "GET"
            });
            let resJson = await res.json();
            console.log("resJson inside newPage users/../short", resJson)
            if (res.status === 200) {
                console.log('other user:', resJson)
                setOtherUser(resJson)
            } else {
                console.log(res)
            }
        } catch (err) {
            console.log(err);
        }
    };

    const loadMessageGroupsData = async () => {
        try {
            await setAccessToken();
            const access_token = localStorage.getItem('access_token')

            const backend_url = `${process.env.REACT_APP_BACKEND_URL}/api/message_groups`
            const res = await fetch(backend_url, {
                headers: {
                    Authorization: `Bearer ${access_token}`
                },
                method: "GET"
            });
            let resJson = await res.json();
            console.log("message_groups inside newPage:", resJson)
            if (res.status === 200) {
                setMessageGroups(resJson)
            } else {
                console.log(res)
            }
        } catch (err) {
            console.log(err);
        }
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