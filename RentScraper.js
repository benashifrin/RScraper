function fetchRedditeData() {
    var scriptProperties = PropertiesService.getScriptProperties();
    var redditClientId = scriptProperties.getProperty('REDDIT_CLIENT_ID');
    var redditSecret = scriptProperties.getProperty('REDDIT_SECRET');
    var redditUsername = scriptProperties.getProperty('REDDIT_USERNAME');
    var redditPassword = scriptProperties.getProperty('REDDIT_PASSWORD');
  
    var clientAuth = Utilities.base64Encode(redditClientId + ':' + redditSecret);
  
    var tokenOptions = {
      method: 'post',
      headers: {
        'Authorization': 'Basic ' + clientAuth,
        'User-Agent': 'myBot/0.0.1'
      },
      payload: {
        'grant_type': 'password',
        'username': redditUsername,
        'password': redditPassword
      },
      muteHttpExceptions: true
    };
  
    var tokenResponse = UrlFetchApp.fetch('https://www.reddit.com/api/v1/access_token', tokenOptions);
    var token = JSON.parse(tokenResponse.getContentText()).access_token;
  
    var dataOptions = {
      method: 'get',
      headers: {
        'Authorization': 'bearer ' + token,
        'User-Agent': 'myBot/0.0.1'
      },
      muteHttpExceptions: true
    };
  
    var params = '?limit=1000';
    var apiUrl = 'https://oauth.reddit.com/r/all/new' + params; // Targeting all subreddits
    var response = UrlFetchApp.fetch(apiUrl, dataOptions);
    var redditData = JSON.parse(response.getContentText());
    var posts = redditData.data.children;
    var postData = [];
    var existingData = [];
  
    var sheetId = ''; // sheet ID here
    var sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
    var lastRow = sheet.getLastRow();
    if (lastRow > 0) {
      existingData = sheet.getRange(1, 2, lastRow, 1).getValues();
      existingData = existingData.flat();
    }
    for (var i = 0; i < posts.length; i++) {
      var post = posts[i].data;
      var postPermalink = 'www.reddit.com' + post.permalink;
      // filter posts here
      if (!existingData.includes(postPermalink) && (post.title.toLowerCase().includes('rent') )) {
        Logger.log(post.title.toLowerCase())
        var date = new Date(post.created_utc * 1000);
        var formattedDateTime = Utilities.formatDate(date, "GMT-05:00", "MM/dd/yyyy HH:mm:ss");
        var date = new Date();
        var timeAddedtoSheet = Utilities.formatDate(date, "GMT-05:00", "MM/dd/yyyy hh:mm:ss a");
        postData.push([
          post.title,
          postPermalink,
          formattedDateTime,
          timeAddedtoSheet,
          post.subreddit_name_prefixed
        ]);
      }
    }
  
    if (postData.length > 0) {
      var nextRow = lastRow + 1;
      var range = sheet.getRange(nextRow, 1, postData.length, 5);
      range.setValues(postData);
      // Extract post titles to include in the email
      var postTitles = postData.map(function(post) {
        return post[0]; 
      });
      Logger.log('New data appended to sheet. Title: ', postTitles);
      sendEmailNotification(postData.length + ' new post(s)', postTitles);
    } else {
      Logger.log('No new data to append.');
    }
  }
  
  
  function sendEmailNotification(message, postTitles) {
    var recipient = "RentZed@gmail.com"; // Replace this with your actual email
    var subject = "Reddit Activity Notification";
  
    // Constructing the body with post titles if they exist
    var body = "Hello,\n\n" + message;
  
    if (postTitles && postTitles.length > 0) {
      body += "\n\nNew Posts Titles:\n" + postTitles.join(',');
    }
  
    body += "\n\nYou can view the spreadsheet at: put spreadsheet link here" +
      "Best,\n" +
      "Your Reddit Data Script";
    
    MailApp.sendEmail(recipient, subject, body);
  }
  
  function sendHighPriorityEmail(message) {
    var recipient = "RentZed@gmail.com"; // Replace with your actual email address
    var subject = "High Priority Notification";
    var body = "Hello,\n\n" + message + "\n\nBest,\nYour Reddit Data Script";
    
    MailApp.sendEmail(recipient, subject, body);
  }
  
  