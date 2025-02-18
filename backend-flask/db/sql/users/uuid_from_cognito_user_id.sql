SELECT
  users.uuid
FROM public.users
WHERE
  users.cognito_user_uuid = %(cognito_user_uuid)s
LIMIT 1