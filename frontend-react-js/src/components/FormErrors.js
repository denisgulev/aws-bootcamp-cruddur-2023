import './FormErrors.css';
import FormErrorItem from '../components/FormErrorItem';

export default function FormErrors(props) {
    let el_errors = null

    if (props.errors.length > 0) {
        el_errors = (<div className='errors'>
            {props.errors.map((err_code, index) => {
                return <FormErrorItem err_code={err_code} uniqueKey={index} />
            })}
        </div>)
    }

    return (
        <div className='errorsWrap'>
            {el_errors}
        </div>
    )
}