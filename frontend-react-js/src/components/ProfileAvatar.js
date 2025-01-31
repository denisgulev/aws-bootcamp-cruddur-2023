import './ProfileAvatar.css';

export default function ProfileAvatar({ cognito_user_uuid }) {
    console.log("Cognito user uuidin PROFILE_AVATAR --> ", cognito_user_uuid)
    const styles = {
        backgroundImage: `url(https://assets.app.denisgulev.com/avatars/${cognito_user_uuid}.jpeg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
    }

    return (
        <div className="profile-avatar" style={styles}></div>
    );
}