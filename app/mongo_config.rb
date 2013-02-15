require 'mongo'

class Quadrants < Sinatra::Base
    conn = Mongo::Connection.new('localhost', 27017)
    set :mongo_connection, conn
    set :mongo_db, conn.db('quadrants_db')

    def object_id val
        BSON::ObjectId.from_string(val)
    end

    def document_by_id id
        id = object_id(id) if String === id
        settings.mongo_db['quadrants_db'].
            find_one(:_id => id).to_json
    end 
end