# Week 3 — Decentralized Authentication

#### SAML
- Security Association Markup Language -> 
allows us to have a single point of entry in any application

#### OpenID Connect
- handles just authentication -> allows us to use our social media accounts to log in to any application

#### OAuth
- handles authorization

### Amazon Cognito

Allows authentication with users stored in amazon account.

1. Cognito User Pool
   1. allows for new registrations
   2. allows for authentication with already existing accounts on other platforms
2. Cognito Identity Pool
   1. creates temporary credentials for users
   2. allows for access to AWS resources

---

Walkthrough of the AWS Cognito service

2 choices:
1. add user directories to existing applications
2. grant access to AWS resources

Why?
1. use directory for customers
2. ability to access AWS Resources for the app
3. identity broker for temporary credentials
4. can extend users to AWS Resources

#### User Lifecycle

1. employee joins
2. IT profile creation
3. assign basic authorization
4. additional app authorization requests
5. employee departs
6. off-board

--> translates to:

1. new employee
2. provision
3. enforce policies
4. update policies (based on role)
5. departs
6. off-board

#### Token lifecycle

Tokens gives access to certain resources.
A user is authenticated, thus it has an access token and the application verifies that the user 
has access to the requested resources.

#### Best Practices

1. On AWS services
   1. AWS services -> make use of user's role of the access token to limit access to services
   2. AWS WAF -> web access firewall (rate limiting, allow/deny list, deny access from regions, etc.)
   3. Cognito should be compliance required as per business requirements
   4. Cognito should be used in the region where the business has the legal right to hold user's information
   5. add AWS Cloudtrail to monitor suspicious behaviour by identities on AWS (adding new user pool or delete existing one, add user more permissions, etc.)
2. On the application
   1. use encrypt connections
   2. use industry standards (SAML, OpenID Connect, OAuth 2.0)
   3. handle user lifecycle (create, update, delete, change roles)
   4. token lifecycle management (create, revoke, refresh)
   5. JWT token best practice (no sensitive information stored)

---

## Provision Cognito User Group

Using the AWS Console we'll create a Cognito User Group.
We'll also create an "app client" of type "Single-page application (SPA)". (this option does not create client secret)

#### Create a user in the user group with the following options: 
1. Alias attributes used to sign in
   1. Email
2. Invitation message
   1. don't send invitation
3. User name
   1. set username as you prefer
4. Email address
   1. add an email that will be used to sing-in
5. Phone number
   1. optional
6. Temporary password
   1. generate an easy to remember password

#### To update confirmation status of the user just created, run
```sh
aws cognito-idp admin-set-user-password \
  --user-pool-id <user-pool-id> \
  --username <username> \
  --password <user-password> \
  --permanent
```

**NB** --> after these settings, we will be able to sign-in with the user we created.

## Install AWS Amplify

Tool to be used client-side to integrate AWS Cognito.

```sh
npm i aws-amplify --save
```

## Configure Amplify

We need to hook up our cognito pool to our code in the `App.js`.
Add all env variables to the docker-compose file under the frontend service.

```js
import { Amplify } from 'aws-amplify';

Amplify.configure({
    Auth: {
        Cognito: {
            // REQUIRED - Amazon Cognito User Pool ID
            userPoolId: process.env.REACT_APP_AWS_USER_POOLS_ID,
            userPoolClientId: process.env.REACT_APP_CLIENT_ID,
            loginWith: {
                email: true
            },
            passwordFormat: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireNumbers: true,
                requireSpecialCharacters: true,
            }
        }
    }
});
```

## Conditionally show components based on logged in or logged out

Inside our `HomeFeedPage.js`

```js
import { getCurrentUser } from 'aws-amplify/auth';

// set a state
const [user, setUser] = React.useState(null);

// check if we are authenicated
const checkAuth = async () => {
  getCurrentUser()
     .then((user) => {
       console.log('user',user);
       return user
     })
     .then((cognito_user) => {
         setUser({
            display_name: cognito_user.username,
            handle: cognito_user.username
         })
     })
     .catch((err) => console.log(err));
};

// check when the page loads if we are authenicated
React.useEffect(()=>{
  loadData();
  checkAuth();
}, [])
```

We'll want to pass user to the following components:

```js
<DesktopNavigation user={user} active={'home'} setPopped={setPopped} />
<DesktopSidebar user={user} />
```

We'll rewrite `DesktopNavigation.js` so that it conditionally shows links in the left hand column
on whether you are logged in or not.

Notice we are passing the user to ProfileInfo

```js
import './DesktopNavigation.css';
import {ReactComponent as Logo} from './svg/logo.svg';
import DesktopNavigationLink from '../components/DesktopNavigationLink';
import CrudButton from '../components/CrudButton';
import ProfileInfo from '../components/ProfileInfo';

export default function DesktopNavigation(props) {
  let button;
  let profile;
  let notificationsLink;
  let messagesLink;
  let profileLink;
  if (props.user) {
    button = <CrudButton setPopped={props.setPopped} />;
    profile = <ProfileInfo user={props.user} />;
    notificationsLink = <DesktopNavigationLink 
      url="/notifications" 
      name="Notifications" 
      handle="notifications" 
      active={props.active} />;
    messagesLink = <DesktopNavigationLink 
      url="/messages"
      name="Messages"
      handle="messages" 
      active={props.active} />
    profileLink = <DesktopNavigationLink 
      url="/@andrewbrown" 
      name="Profile"
      handle="profile"
      active={props.active} />
  }

  return (
    <nav>
      <Logo className='logo' />
      <DesktopNavigationLink url="/" 
        name="Home"
        handle="home"
        active={props.active} />
      {notificationsLink}
      {messagesLink}
      {profileLink}
      <DesktopNavigationLink url="/#" 
        name="More" 
        handle="more"
        active={props.active} />
      {button}
      {profile}
    </nav>
  );
}
```

We'll update `ProfileInfo.js`, adding signOut handling:

```js
import { signOut } from 'aws-amplify/auth';

const signOut = async () => {
    try {
        await signOut({ global: true })
        .then(info => {
            window.location.href = "/"
        })
    } catch (error) {
        console.log('error signing out: ', error);
    }
}
```

We'll rewrite `DesktopSidebar.js` so that it conditionally shows components in case you are logged in or not.

```js
import './DesktopSidebar.css';
import Search from '../components/Search';
import TrendingSection from '../components/TrendingsSection'
import SuggestedUsersSection from '../components/SuggestedUsersSection'
import JoinSection from '../components/JoinSection'

export default function DesktopSidebar(props) {
  const trendings = [
    {"hashtag": "100DaysOfCloud", "count": 2053 },
    {"hashtag": "CloudProject", "count": 8253 },
    {"hashtag": "AWS", "count": 9053 },
    {"hashtag": "FreeWillyReboot", "count": 7753 }
  ]

  const users = [
    {"display_name": "Andrew Brown", "handle": "andrewbrown"}
  ]

  let trending;
  let suggested;
  let join;

  if (props.user) {
    trending = <TrendingSection trendings={trendings} />
    suggested = <SuggestedUsersSection users={users} />
  } else {
    join = <JoinSection />
  }

  return (
    <section>
      <Search />
      {trending}
      {suggested}
      {join}
      <footer>
        <a href="#">About</a>
        <a href="#">Terms of Service</a>
        <a href="#">Privacy Policy</a>
      </footer>
    </section>
  );
}
```

## Signin Page

```js
import { signIn, fetchAuthSession } from 'aws-amplify/auth';

const [errors, setErrors] = React.useState('');

const onsubmit = async (event) => {
    setErrors('')
    event.preventDefault();
    try {
      const { isSignedIn, nextStep } = await signIn({ username: email, password: password });
      if (isSignedIn) {
        const session = await fetchAuthSession();
        const { accessToken, idToken } = session.tokens ?? {};
        localStorage.setItem("access_token", accessToken);
        window.location.href = "/";
      }
    } catch (error) {
    console.log("error signIn operation", error)
      if (error.code == 'UserNotConfirmedException') {
        window.location.href = "/confirm"
      }
      setErrors(error.message)
    }
    return false
  }

let errors;
if (cognitoErrors){
  errors = <div className='errors'>{cognitoErrors}</div>;
}

// just before submit component
{errors}
```

## Signup Page

```js
import { signUp } from "aws-amplify/auth";


const onsubmit = async (event) => {
  event.preventDefault();
  setErrors('')
  try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password: password,
        attributes: {
            name: name,
            email: email,
            preferred_username: username,
        },
        autoSignIn: { // optional - enables auto sign in after user is confirmed
            enabled: true,
        }
      });
      console.log(userId);
      window.location.href = `/confirm?email=${email}`
  } catch (error) {
      console.log(error);
      setErrors(error.message)
  }
  return false
}

let el_errors;
if (errors){
 el_errors = <div className='errors'>{errors}</div>;
}

//before submit component
{el_errors}
```

## Confirmation Page

```js
const resend_code = async (event) => {
  setErrors('')
  try {
    await Auth.resendSignUp(email);
    console.log('code resent successfully');
    setCodeSent(true)
  } catch (err) {
    // does not return a code
    // does cognito always return english
    // for this to be an okay match?
    console.log(err)
    if (err.message == 'Username cannot be empty'){
      setErrors("You need to provide an email in order to send Resend Activiation Code")   
    } else if (err.message == "Username/client id combination not found."){
      setErrors("Email is invalid or cannot be found.")   
    }
  }
}

const onsubmit = async (event) => {
  event.preventDefault();
  setErrors('')
  try {
    await Auth.confirmSignUp(email, code);
    window.location.href = "/"
  } catch (error) {
    setErrors(error.message)
  }
  return false
}
```

## Recovery Page

```js
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';

const onsubmit_send_code = async (event) => {
  event.preventDefault();
  setErrors('')
  await resetPassword({
     username
   })
     .then((data) => setFormState('confirm_code') )
     .catch((err) => setErrors(err.message) );
  return false
}

const onsubmit_confirm_code = async (event) => {
  event.preventDefault();
  setErrors('')
  if (password == passwordAgain){
   await confirmResetPassword({
      username,
      confirmationCode: code,
      newPassword: password,
   });
    .then((data) => setFormState('success'))
    .catch((err) => setErrors(err.message) );
  } else {
    setErrors('Passwords do not match')
  }
  return false
}
```

## Authenticating Server Side

In the `HomeFeedPage.js` add a header to pass along the access token

```js
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`
  }
```

In the `app.py`, add cors configuration:

```py
cors = CORS(
  app, 
  resources={r"/api/*": {"origins": origins}},
  headers=['Content-Type', 'Authorization'], 
  expose_headers='Authorization',
  methods="OPTIONS,GET,HEAD,POST"
)
```