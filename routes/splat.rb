class Quadrants < Sinatra::Base
    get '*/js/*' do
    	content_type 'text/javascript'
    	file = params[:splat][1]
    	File.read(File.join("public/js/", "#{file}"))
    end

    get '/*' do
        @root = request.host_with_port
        @route = params[:splat].first
        haml :appLayout
    end     
end