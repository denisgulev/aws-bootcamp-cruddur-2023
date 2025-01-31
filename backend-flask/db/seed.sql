INSERT INTO public.users (email, display_name, handle, cognito_user_uuid, bio)
VALUES
    ('denis.gulev@gmail.com', 'Denis Gulev', 'denis' ,'MOCK', ''),
    ('bob@example.co', 'Bob', 'bob' ,'MOCK', ''),
    ('alice@example.co', 'Alice', 'alice' ,'MOCK', '');

INSERT INTO public.activities (user_uuid, message, expires_at) VALUES (
    ( SELECT uuid FROM public.users WHERE users.handle = 'denis' LIMIT 1), 'Hello, world!', current_timestamp + interval '10 day'
    );