class Quadrants < Sinatra::Base
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
end