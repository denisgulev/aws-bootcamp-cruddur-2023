import './Replies.css';
import ActivityItem from './ActivityItem';

export default function Replies({ replies, setReplyActivity, setPopped, parentUuid = null }) {
    const filteredReplies = replies.filter(reply => reply.reply_to_activity_uuid === parentUuid);

    const content = replies.length === 0 ? (
        <div className="replies-primer">
            <span>Nothing to see here yet</span>
        </div>
    ) : (
        <div className="replies-list">
            {filteredReplies.map((activity, index) => (
                <div key={index} className="reply-item">
                    <ActivityItem
                        setReplyActivity={setReplyActivity}
                        setPopped={setPopped}
                        key={index}
                        activity={activity}
                        mainActivity={activity.expires_at != null}
                    />
                    {/* Recursively render nested replies */}
                    <Replies
                        replies={replies}
                        setReplyActivity={setReplyActivity}
                        setPopped={setPopped}
                        parentUuid={activity.uuid}
                    />
                </div>
            ))}
        </div>
    );

    return <div>{content}</div>;
}