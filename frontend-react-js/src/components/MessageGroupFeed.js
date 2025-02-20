import './MessageGroupFeed.css';
import MessageGroupItem from './MessageGroupItem';
import MessageGroupNewItem from './MessageGroupNewItem';

export default function MessageGroupFeed({ message_groups, otherUsers }) {
  let message_group_new_item;
  if (otherUsers) {
    message_group_new_item = <MessageGroupNewItem user={otherUsers} />
  }
  return (
    <div className='message_group_feed'>
      <div className='message_group_feed_heading'>
        <div className='title'>Messages</div>
      </div>
      <div className='message_group_feed_collection'>
        {message_group_new_item}
        {message_groups.map((message_group, index) => {
          return <MessageGroupItem key={index} message_group={message_group} />
        })}
      </div>
    </div>
  );
}