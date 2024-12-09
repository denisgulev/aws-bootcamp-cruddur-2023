INSERT INTO public.users (display_name, handle, cognito_user_id) VALUES ('Alice', 'alice', 'MOCK'), ('Bob', 'bob', 'mock');

INSERT INTO public.activities (user_uuid, message, expires_at) VALUES (
    ( SELECT uuid FROM public.users WHERE users.handle = 'bob' LIMIT 1), 'Hello, world!', current_timestamp + interval '10 day'
    );