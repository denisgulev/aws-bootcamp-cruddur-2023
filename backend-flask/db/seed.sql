INSERT INTO public.users (email, display_name, handle, cognito_user_id) VALUES ('denis.gulev@gmail.com', 'Denis Gulev', 'denis' ,'MOCK'),
                                                                          ('bob@example.co', 'Bob', 'bob' ,'MOCK');

INSERT INTO public.activities (user_uuid, message, expires_at) VALUES (
    ( SELECT uuid FROM public.users WHERE users.handle = 'bob' LIMIT 1), 'Hello, world!', current_timestamp + interval '10 day'
    );