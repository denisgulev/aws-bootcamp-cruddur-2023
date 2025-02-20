import './ActivityShowPage.css';
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from 'react-router-dom';

import DesktopNavigation from '../components/DesktopNavigation';
import DesktopSidebar from '../components/DesktopSidebar';
import ActivityForm from '../components/ActivityForm';
import ReplyForm from '../components/ReplyForm';
import Replies from '../components/Replies';
import ActivityItem from '../components/ActivityItem';

import { get } from '../lib/Requests';
import { useAuth } from '../hooks/useAuth';
import { useHomeFeed } from '../hooks/useHomeFeed';

export default function ActivityShowPage() {
    const { replyActivity, setReplyActivity, popped, setPopped, poppedReply, setPoppedReply } = useHomeFeed();
    const [activity, setActivity] = React.useState(null);
    const [replies, setReplies] = useState([]);
    const dataFetchedRef = useRef(false);
    const params = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const goBack = () => navigate(-1);

    const partition = (ary, callback) =>
        ary.reduce((acc, e) => {
            acc[callback(e) ? 0 : 1].push(e)
            return acc
        }, [[], []])

    const loadData = async () => {
        const url = `${process.env.REACT_APP_BACKEND_URL}/api/activities/${params.handle}/status/${params.activity_uuid}`;
        get(url, {
            auth: false,
            success: (data) => {
                let [activities, replies] = partition(data.replies, (x => x.depth === 1));
                setActivity(activities[0]);
                setReplies(data.replies);
            },
        });
    };

    useEffect(() => {
        if (dataFetchedRef.current) return;
        dataFetchedRef.current = true;
        loadData();
    }, []);

    let el_activity
    if (activity !== null) {
        el_activity = (
            <ActivityItem
                expanded={true}
                setReplyActivity={setReplyActivity}
                setPopped={setPoppedReply}
                activity={activity}
            />
        )
    }

    return (
        <article>
            <DesktopNavigation user={user} active={'home'} setPopped={setPopped} />
            <div className="content">
                <ActivityForm popped={popped} setPopped={setPopped} />
                <ReplyForm
                    activity={replyActivity}
                    popped={poppedReply}
                    setReplies={setReplies}
                    setPopped={setPoppedReply}
                />
                <div className="activity-feed">
                    <div className="activity-feed__header flex">
                        <div className="back" onClick={goBack}>&larr;</div>
                        <div className="title">Crud</div>
                    </div>
                    {el_activity}
                    <Replies
                        setReplyActivity={setReplyActivity}
                        setPopped={setPoppedReply}
                        replies={replies}
                        parentUuid={activity?.uuid}
                    />
                </div>
            </div>
            <DesktopSidebar user={user} />
        </article>
    );
}