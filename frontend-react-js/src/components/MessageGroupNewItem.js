import './MessageGroupItem.css';
import { Link } from "react-router-dom";

export default function MessageGroupNewItem({ user }) {
    return (
        <Link className='message_group_item active' to={`/messages/new/` + user.handle}>
            <div className='message_group_avatar'></div>
            <div className='message_content'>
                <div className='message_group_meta'>
                    <div className='message_group_identity'>
                        <div className='display_name'>{user.display_name}</div>
                        <div className="handle">@{user.handle}</div>
                    </div>{/* activity_identity */}
                </div>{/* message_meta */}
            </div>{/* message_content */}
        </Link>
    );
}