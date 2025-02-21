import './CrudButton.css';

export default function CrudButton({ setPopped }) {
  const handleClick = () => {
    setPopped(true);
  };

  return (
    <button onClick={handleClick} className="desktop-navigation__button">
      Crud
    </button>
  );
}