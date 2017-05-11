var rp = require('request-promise');
var async = require('async');
var mysql = require('mysql');
var env = require('./env');


var mysqlCredentials = env.mysqlCredentials();
var connection = mysql.createConnection({
  host     : mysqlCredentials.host,
  user     : mysqlCredentials.user,
  password : mysqlCredentials.password,
  database : mysqlCredentials.database
});

function scrapePage(page) {
    rp(page)
    .then(function (pageData) {
        pageData = JSON.parse(pageData);
        news = pageData.data;

        connection.connect();

        var articleNumber = 1;
        async.each(news, function(newsItem, callbackArticle) {
            var article = {};
            var title, articleUrl, author, imageUrl, publishedAt;
            var articleContent = "";

            title = newsItem.title;
            articleUrl = "https://www.gate15.be" + newsItem.uriPrefix + "/" + newsItem.slug;
            author = "gate15";
            publishedAt = newsItem.publishedAt;
            
            var snippetPart = 1;
            async.each(newsItem.snippets, function(snippet, callbackSnippet) {
                //only first type=media is the article pic
                if (snippet.type == "media" && !imageUrl) {
                    imageUrl = snippet.body.file[0].src;
                } else {
                    articleContent += snippet.body.text + " ";
                }
                
                callbackSnippet();
            }, function() {
                
                //mysql column names
                article.title = title;
                article.author = author;
                article.article_url = articleUrl;
                article.picture_url = imageUrl;
                article.published_on = publishedAt.substring(0,10);
                article.content = articleContent;
                article.is_accepted = 0;

                console.log(articleNumber);
                articleNumber++;

                connection.query('SELECT id FROM gate15_articles WHERE title="' + title + '"', function (error, result, fields) {
                    //if (error) throw error;
                    if (result[0]) {
                        //console.log("article already exists, doing nothing");
                        callbackArticle();
                    } else {
                        var query = connection.query('INSERT INTO gate15_articles SET ?', article, function(err, result) {
                        if (err) console.log(err);
                            //console.log('result:', result);
                        });
                        //console.log(query.sql);
                        callbackArticle();
                    }
                });
            });
        }, function() {
            console.log("Finished getting articles.");
            connection.end();
        });

    })
    .catch(function (err) {
        // Crawling failed... 
    });

}

scrapePage("https://www.gate15.be/srv/content/d/content-type/10/start/0/limit/50/excluded_tags/trots");