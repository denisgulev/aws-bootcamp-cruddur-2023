from lib.db import db

class UpdateProfile:
    @staticmethod
    def run(cognito_user_uuid,bio,display_name):
        print('cognito_user_uuid:',cognito_user_uuid)
        print('bio:',bio)
        print('display_name:',display_name)
        model = {
            'errors': None,
            'data': None
        }

        if display_name is None or len(display_name) < 1:
            model['errors'] = ['display_name_blank']

        if model['errors']:
            model['data'] = {
                'bio': bio,
                'display_name': display_name
            }
        else:
            UpdateProfile.update_profile(bio,display_name,cognito_user_uuid)
            data = UpdateProfile.query_users_short()
            model['data'] = data
        return model

    @staticmethod
    def update_profile(bio,display_name,cognito_user_uuid):
        if bio is None:
            bio = ''

        sql = db.template('users','update')
        db.query_commit(sql,{
            'cognito_user_uuid': cognito_user_uuid,
            'bio': bio,
            'display_name': display_name
        })

    @staticmethod
    def query_users_short(handle):
        sql = db.template('users','short')
        data = db.query_object_json(sql,{
            'handle': handle
        })
        return data