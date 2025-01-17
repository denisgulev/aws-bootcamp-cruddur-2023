import './MessageItem.css';
import { Link } from "react-router-dom";
import { format_datetime, message_time_ago } from '../lib/DateTimeFormats';

export default function MessageItem({ message }) {

  return (
    <div className='message_item'>
      <Link className='message_avatar' to={`/messages/@` + message.handle}></Link>
      <div className='message_content'>
        <div className='message_meta'>
          <div className='message_identity'>
            <div className='display_name'>{message.display_name}</div>
            <div className="handle">@{message.handle}</div>
          </div>{/* activity_identity */}
        </div>{/* message_meta */}
        <div className="message">{message.message}</div>
        <div className="created_at" title={format_datetime(message.created_at)}>
          <span className='ago'>{message_time_ago(message.created_at)}</span>
        </div>{/* created_at */}
      </div>{/* message_content */}
    </div>
  );
}