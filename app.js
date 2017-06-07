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

function scrapeNews(page) {
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

            tags = "";
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
                async.each(newsItem.tags, function(tag, callbackTag) {
                    tags = tag.replace("-", "");
                    tags = tags.replace(" ", "");
                    callbackTag();
                }, function() {
                    //mysql column names
                    article.title = title;
                    article.author = author;
                    article.article_url = articleUrl;
                    article.picture_url = imageUrl;
                    article.published_on = publishedAt.substring(0,10);
                    article.content = articleContent;
                    article.is_accepted = 0;
                    article.tags = tags;

                    console.log("Article n.:", articleNumber);
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
            });
        }, function() {
            console.log("Finished getting articles.");
            //connection.end();
        });

    })
    .catch(function (err) {
        // Crawling failed... 
    });

}

function scrapeEvents(page) {
    rp(page)
    .then(function (pageData) {
        pageData = JSON.parse(pageData);
        events = pageData.data;

        //connection.connect();

        var eventNumber = 1;
        async.each(events, function(eventsItem, callbackEvent) {
            var event = {};
            var title, eventUrl, originalUrl, author, imageUrl, eventBeginDate, eventEndDate, price, eventType;
            var eventContent = "";

            tags = "";
            title = eventsItem.title;
            eventUrl = "https://www.gate15.be" + eventsItem.uriPrefix + "/" + eventsItem.slug;
            author = "gate15";
            
            var snippetPart = 1;
            async.each(eventsItem.snippets, function(snippet, callbackSnippet) {
                //only first type=media is the event pic
                if (snippet.type == "media" && !imageUrl) {
                    imageUrl = snippet.body.file[0].src;
                } else {
                    eventContent += snippet.body.description + " ";
                    eventType = snippet.body.type;
                    eventBeginDate = snippet.body.dates[0].beginConverted.sec + 7200;
                    eventEndDate = snippet.body.dates[0].endConverted.sec + 7200;
                    price = snippet.body.price;
                    originalUrl = snippet.body.url;

                }
                callbackSnippet();
            }, function() {
                async.each(eventsItem.tags, function(tag, callbackTag) {
                    tags = tag.replace("-", "");
                    tags = tags.replace(" ", "");
                    callbackTag();
                }, function() {
                    //mysql column names
                    event.title = title;
                    event.author = author;
                    event.event_url = eventUrl;
                    event.original_url = originalUrl;
                    event.picture_url = imageUrl;
                    event.event_begin_date = eventBeginDate;
                    event.event_end_date = eventEndDate;
                    event.content = eventContent;
                    event.tags = tags;
                    event.price = price;
                    event.event_type = eventType;

                    console.log("Event n.:", eventNumber);
                    eventNumber++;

                    connection.query('SELECT id FROM gate15_events WHERE title="' + title + '"', function (error, result, fields) {
                        //if (error) throw error;
                        if (result[0]) {
                            //console.log("event already exists, doing nothing");
                            callbackEvent();
                        } else {
                            var query = connection.query('INSERT INTO gate15_events SET ?', event, function(err, result) {
                            if (err) console.log(err);
                                //console.log('result:', result);
                            });
                            //console.log(query.sql);
                            callbackEvent();
                        }
                    });
                });
            });
        }, function() {
            console.log("Finished getting events.");
            connection.end();
        });

    })
    .catch(function (err) {
        // Crawling failed... 
    });

}

scrapeNews("https://www.gate15.be/srv/content/d/content-type/10/start/0/limit/50/excluded_tags/trots");
scrapeEvents("https://www.gate15.be/srv/content/d/content-type/12/start/0/limit/50");