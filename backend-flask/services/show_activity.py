from lib.db import db

class ShowActivity:
  @staticmethod
  def run(handle, activity_uuid):
    sql = db.template('activities','show')
    results = db.query_object_json(sql,{
      'uuid': activity_uuid
    })
    return results