SELECT
  users.uuid,
  users.display_name,
  users.handle,
  CASE users.cognito_user_uuid = %(cognito_user_uuid)s
  WHEN TRUE THEN
    'sender'
  WHEN FALSE THEN
    'recv'
  ELSE
    'other'
  END as kind
FROM public.users
WHERE
  users.cognito_user_uuid = %(cognito_user_uuid)s
  OR
  users.handle = %(user_receiver_handle)s