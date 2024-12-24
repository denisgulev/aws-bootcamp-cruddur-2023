import './MessageItem.css';
import { Link } from "react-router-dom";
import { DateTime } from 'luxon';

export default function MessageItem({ message }) {

  const format_time_created_at = (value) => {
    // format: 2050-11-20 18:32:47 +0000
    const created = DateTime.fromISO(value)
    const now = DateTime.now()
    const diff_mins = now.diff(created, 'minutes').toObject().minutes;
    const diff_hours = now.diff(created, 'hours').toObject().hours;

    if (diff_hours > 24.0) {
      return created.toFormat("LLL L");
    } else if (diff_hours < 24.0 && diff_hours > 1.0) {
      return `${Math.floor(diff_hours)}h`;
    } else if (diff_hours < 1.0) {
      return `${Math.round(diff_mins)}m`;
    }
  };

  return (
    <Link className='message_item' to={`/messages/@` + message.handle}>
      <div className='message_avatar'></div>
      <div className='message_content'>
        <div className='message_meta'>
          <div className='message_identity'>
            <div className='display_name'>{message.display_name}</div>
            <div className="handle">@{message.handle}</div>
          </div>{/* activity_identity */}
        </div>{/* message_meta */}
        <div className="message">{message.message}</div>
        <div className="created_at" title={message.created_at}>
          <span className='ago'>{format_time_created_at(message.created_at)}</span>
        </div>{/* created_at */}
      </div>{/* message_content */}
    </Link>
  );
}