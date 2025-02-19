INSERT INTO public.activities (user_uuid, message, expires_at) 
VALUES (
    (
    SELECT uuid FROM public.users WHERE users.cognito_user_uuid = %(cognito_user_uuid)s LIMIT 1
    ),
    %(message)s, 
    %(expires_at)s
) RETURNING uuid;