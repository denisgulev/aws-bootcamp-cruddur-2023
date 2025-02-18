UPDATE public.users
SET
  bio = %(bio)s,
  display_name= %(display_name)s
WHERE
  users.cognito_user_uuid = %(cognito_user_uuid)s
RETURNING handle;