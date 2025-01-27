import './EditProfileButton.css';

export default function EditProfileButton({ setPopped }) {
    const handleClick = (event) => {
        event.preventDefault();
        setPopped(true);
    };

    return (
        <button onClick={handleClick} className="post">
            Edit Profile
        </button>
    );
}