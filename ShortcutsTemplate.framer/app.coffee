shortcuts = require "shortcuts"
shortcuts.initialize()

layer = new Layer
layer.center()

layer.click ->
	layer.animateTo { y:500 }, ->
		layer.fadeOut()