class Quadrants < Sinatra::Base
    get '/*' do
        @route = params[:splat].first
        haml :appLayout
    end     
end