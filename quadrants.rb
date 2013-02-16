# encoding: UTF-8
require 'rubygems'
require 'sinatra/base'
require 'sinatra/partial'
require 'haml'
require 'json'

class Quadrants < Sinatra::Base
    
    register Sinatra::Partial
    enable :partial_underscores
    enable :sessions 

    # Configuration:::::::::::::::::::::::::::::::::::::::::::::::
    set :haml, { :format => :html5, :ugly => true }
    set :server, %w[thin mongrel webrick]
    set :port, 4567  

end

require_relative 'app/mongo_config'
require_relative 'routes/tasks'
require_relative 'routes/splat'