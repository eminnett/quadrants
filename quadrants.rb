# encoding: UTF-8
require 'rubygems'
require 'sinatra/base'
require 'sinatra/partial'
require 'haml'
require 'mongo'
require 'json'

class Quadrants < Sinatra::Base
    
    register Sinatra::Partial
    enable :partial_underscores
    enable :sessions 

    # Configuration:::::::::::::::::::::::::::::::::::::::::::::::
    set :haml, { :format => :html5, :ugly => true }
    set :server, %w[thin mongrel webrick]
    set :port, 4567

    # Route Handlers::::::::::::::::::::::::::::::::::::::::::::::

    conn = Mongo::Connection.new('localhost', 27017)
    set :mongo_connection, conn
    set :mongo_db, conn.db('quadrants_db')

    get '/tasks/?' do
        content_type :json
        settings.mongo_db['quadrants_db'].find.to_a.to_json
    end

    get '/task/?' do
        content_type :json
        document_by_id(params).to_json
    end

    post '/task/?' do
        content_type :json
        new_id = settings.mongo_db['quadrants_db'].insert params
        document_by_id(new_id).to_json
    end

    put '/task/?' do
        request_body = JSON.parse(request.body.read.to_s)
        id = object_id(request_body['id'])
        settings.mongo_db['quadrants_db'].update({:_id => id}, request_body.reject{|k,v| k == '_id'})
        document_by_id(id).to_json
    end

    delete '/task/:id' do
        settings.mongo_db['quadrants_db'].remove(:_id => object_id('#{params[:id]}'))
        {:success => true}.to_json
    end

    def object_id val
        BSON::ObjectId.from_string(val)
    end

    def document_by_id id
        id = object_id(id) if String === id
        settings.mongo_db['quadrants_db'].
            find_one(:_id => id).to_json
    end 

    get '/*' do
        @route = params[:splat].first
        haml :appLayout
    end
        
end