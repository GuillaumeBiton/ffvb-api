var jsdom = require('jsdom'),
	express = require('express'),
	mongo = require('mongodb'),
	fs = require('fs'),
	app = express();

try {
  config = JSON.parse(fs.readFileSync(process.cwd()+"/config.json"));
} catch(e) {
  console.log(e);
}

app.get('/', function(req,res){
	res.send(JSON.stringify({
		title: 'FFVB (Unofficial) API'
	}));
});
app.get('/uncached/news', function(req, res){
	jsdom.env({
		html: 'http://ffvb.org/front/index.php?mduuseid=Mjg%3D&dsgtypid=37&page=article',
		scripts: ['http://code.jquery.com/jquery-1.8.2.min.js' ],
		done: function(errors, window) {
			var $ = window.$;
			// console.log('FFVB Actus');
			var news = [];
			$('.mduActualiteListContainer').each(function() {
				var date = this.getElementsByClassName('cmsDate1')[0].innerHTML;
				var title = this.getElementsByClassName('cmsTitre2')[0].innerHTML;
				if(this.getElementsByClassName('cmsTexte3')[0] !== undefined) var author = this.getElementsByClassName('cmsTexte3')[0].innerHTML;
				if(this.getElementsByClassName('cmsExtract1')[0] !== undefined) var resume = this.getElementsByClassName('cmsExtract1')[0].innerHTML;
				var url = this.getElementsByClassName('cmsReadMore1')[0].href;
				var id = url.substr(url.indexOf("actid=") + 6, url.length);
				var img = {
					src : 'http://www.ffvb.org' + this.getElementsByClassName('cmsThumbLeft')[0].src,
					// alt : this.getElementsByClassName('cmsThumbLeft')[0].alt
				}
				news.push({
					id: id,
					date: date,
					title: title,
					author: author,
					resume: resume,
					url: url,
					img: img
				})
			});
			var db = new mongo.Db('ffvb-api', new mongo.Server(config.db.host, config.db.port, {'auto-reconnect': true}), {safe:false});
			db.open(function(err, db) {
				db.authenticate(config.db.username, config.db.password, function() {
					db.collection("news", function(err, collection){
						collection.drop();
						collection.insert(news, {safe:true}, function(err, docs){
							db.close();
						})
					})
				})
			})
			res.send(JSON.stringify(news));
		}
	})
});
app.get('/uncached/news/:id', function(req,res){
	jsdom.env({
		html: 'http://ffvb.org/front/index.php?mduuseid=Mw%3D%3D&dsgtypid=37&page=actu&actid=' + req.params.id,
		scripts: ['http://code.jquery.com/jquery-1.8.2.min.js'],
		done: function(errors, window) {
			var $ = window.$
			var container = $('.mduActualiteContainer')[0];
			var title = container.getElementsByClassName('cmsTitre2')[0].innerHTML;
			var date = container.getElementsByClassName('cmsDate1')[0].innerHTML;
			var author = container.getElementsByClassName('cmsText3')[0].innerHTML;
			var resume = container.getElementsByClassName('cmsExtract1')[0].innerHTML;
			var content = container.getElementsByClassName('cmsTexte1')[0].innerHTML;
			var news = {
				title: title,
				date: date,
				author: author,
				resume: resume,
				content: content
			};
			res.send(JSON.stringify(news));
		}
	})
});
app.get('/cached/news', function(req, res){
	var db = new mongo.Db('ffvb-api', new mongo.Server(config.db.host, config.db.port, {'auto-reconnect': true}), {safe:false});
	db.open(function(err, db) {
		db.authenticate(config.db.username, config.db.password, function() {
			db.collection("news", function(err, collection){
				collection.find().toArray(function(err, docs){
					res.send(docs);
					db.close();
				});
			})
		})
	})
})
app.get('/uncached/competition/:ligue/:poule', function(req, res){
	jsdom.env({
		html: 'http://www.ffvbbeach.org/ffvbapp/resu/vbspo_calendrier.php?saison=2012%2F2013&codent=' + req.params.ligue + '&poule=' + req.params.poule+ '&division=&tour=&calend=COMPLET',
		scripts: ['http://code.jquery.com/jquery-1.8.2.min.js'],
		done: function(errors, window) {
			var $ = window.$
			var day = 1,
				matches = [];
			var calendartable = $('table')[3];
			var rows = calendartable.getElementsByTagName('tr');
			for (var i=0; i < rows.length; i++) {
				var cells = rows[i].getElementsByTagName('td');
				if( cells.length == 1 ) {
					if(matches.length != 0) day += 1;
					continue;
				}
				if (cells.length > 1) {
					var id = cells[0].innerHTML;
					var date = cells[1].innerHTML;
					var time = cells[2].innerHTML;
					var home = cells[3].innerHTML;
					var guest = cells[5].innerHTML;
				}
				if(cells.length == 10) {
					var place = cells[7].innerHTML;
					var arbitres = cells[9].innerHTML;
					var results = null;
				}
				if (cells.length == 11) {
					var results = cells[8].innerHTML;
					var arbitres = cells[10].innerHTML;
					var place = null;
				}
				matches.push({
					id: id,
					day: day,
					date: date,
					time: time,
					home: home,
					guest: guest,
					place: place || null,
					results: results || null,
					arbitres: arbitres
				})
			}
			var db = new mongo.Db('ffvb-api', new mongo.Server(config.db.host, config.db.port, {'auto-reconnect': true}), {safe:false});
			db.open(function(err, db) {
				db.authenticate(config.db.username, config.db.password, function() {
					db.collection(req.params.ligue + '.' + req.params.poule, function(err, collection){
						collection.drop();
						collection.insert(matches, {safe:true}, function(err, docs){
							db.close();
						})
					})
				})
			})
			res.send(JSON.stringify(matches));
		}
	})
})
app.get('/cached/competition/:ligue/:poule', function(req, res){
	var db = new mongo.Db('ffvb-api', new mongo.Server(config.db.host, config.db.port, {'auto-reconnect': true}), {safe:false});
	db.open(function(err, db) {
		db.authenticate(config.db.username, config.db.password, function() {
			db.collection(req.params.ligue + '.' + req.params.poule, function(err, collection){
				collection.find().toArray(function(err, docs){
					if(docs.length == 0 ) res.redirect('/uncached/competition/' + req.params.ligue + '/' + req.params.poule);
					else res.send(docs);
					db.close();
				});
			})
		})
	})
})

var port = process.env.PORT || 5000;
app.listen(port);
