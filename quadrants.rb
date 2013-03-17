# encoding: UTF-8
require 'rubygems'
require 'bundler'

Bundler.require

require 'sinatra/base'
require 'haml'
require 'json'

class Quadrants < Sinatra::Base

    enable :sessions

    # Configuration:::::::::::::::::::::::::::::::::::::::::::::::
    set :haml, { :format => :html5, :ugly => true }
    set :server, %w[thin mongrel webrick]

end

require_relative 'app/mongo_config'
require_relative 'routes/tasks'
require_relative 'routes/splat'