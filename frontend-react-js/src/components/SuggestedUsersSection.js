import './SuggestedUserSection.css';
import SuggestedUserItem from '../components/SuggestedUserItem';

export default function SuggestedUsersSection(props) {
  return (
    <div className="suggested_users">
      <div className='suggested_users_title'>
        Suggested Users
      </div>
      {props.users.map(({ handle, display_name }) => {
        return <SuggestedUserItem key={handle} display_name={display_name} handle={handle} />
      })}
    </div>
  );
}