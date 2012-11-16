var jsdom = require('jsdom'),
	express = require('express'),
	app = express();

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
			console.log(window)
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

var port = process.env.PORT || 5000;
app.listen(port);
