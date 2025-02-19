from lib.db import db

class HomeActivities:
  @staticmethod
  def run(cognito_user_uuid=None):
    sql = db.template('activities','home')
    results = db.query_array(sql)
    return results
