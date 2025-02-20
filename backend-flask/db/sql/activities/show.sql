--SELECT
--(SELECT COALESCE(row_to_json(object_row),'{}'::json) FROM (
--     SELECT
--       activities.uuid,
--       users.display_name,
--       users.handle,
--       activities.message,
--       activities.replies_count,
--       activities.reposts_count,
--       activities.likes_count,
--       activities.expires_at,
--       activities.created_at
--     FROM public.activities
--     LEFT JOIN public.users ON users.uuid = activities.user_uuid
--     WHERE activities.uuid = %(uuid)s
--   ) object_row
--) as activity,
--(SELECT COALESCE(array_to_json(array_agg(row_to_json(array_row))),'[]'::json) FROM (
--   SELECT
--     replies.uuid,
--     reply_users.display_name,
--     reply_users.handle,
--     replies.message,
--     replies.replies_count,
--     replies.reposts_count,
--     replies.likes_count,
--     replies.reply_to_activity_uuid,
--     replies.created_at
--   FROM public.activities replies
--   LEFT JOIN public.users reply_users ON reply_users.uuid = replies.user_uuid
--   WHERE replies.reply_to_activity_uuid = %(uuid)s
--   ORDER BY replies.created_at ASC
--   ) array_row
--) as replies
--FROM public.activities
--LEFT JOIN public.users ON users.uuid = activities.user_uuid
--WHERE activities.uuid = %(uuid)s
--ORDER BY activities.created_at DESC

WITH RECURSIVE activity_tree AS (
    -- Base case: Fetch the initial post
    SELECT
        activities.uuid,
        activities.user_uuid,
        activities.message,
        activities.replies_count,
        activities.reposts_count,
        activities.likes_count,
        activities.reply_to_activity_uuid,
        activities.expires_at,
        activities.created_at,
        users.display_name,
        users.handle,
        1 AS depth -- Root level
    FROM public.activities
    LEFT JOIN public.users ON users.uuid = activities.user_uuid
    WHERE activities.uuid = %(uuid)s

    UNION ALL

    -- Recursive case: Fetch replies to the replies
    SELECT
        replies.uuid,
        replies.user_uuid,
        replies.message,
        replies.replies_count,
        replies.reposts_count,
        replies.likes_count,
        replies.reply_to_activity_uuid,
        replies.expires_at,
        replies.created_at,
        reply_users.display_name,
        reply_users.handle,
        at.depth + 1 AS depth -- Increase depth level
    FROM public.activities replies
    JOIN activity_tree at ON replies.reply_to_activity_uuid = at.uuid
    LEFT JOIN public.users reply_users ON reply_users.uuid = replies.user_uuid
)
SELECT
    json_agg(activity_tree ORDER BY activity_tree.depth ASC, activity_tree.created_at ASC) AS replies
FROM activity_tree