#!/usr/bin/env node
var express = require('express')
var path = require('path')
var bodyParser = require('body-parser')
var compression = require('compression')
var app = express()

app.use(compression())
app.use(bodyParser.json())

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")

	if(req.url.indexOf('/img/') === 0 || req.url.indexOf('/dist/') === 0){
		res.header("Expires", new Date(Date.now() + 2592000000).toUTCString())
	}
	next()
})

app.use(express.static(__dirname + '/dist',{
	maxAge: "1d"
}))

app.get('*', function(req, res){
	res.sendFile('index.html', { root: __dirname + '/dist' });
})

app.set('port', process.env.PORT || 8000)

var server = app.listen(app.get('port'), function() {
	console.log('Express server listening at http://localhost:' + server.address().port)
})